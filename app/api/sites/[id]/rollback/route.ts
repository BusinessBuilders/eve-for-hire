import { NextRequest, NextResponse } from 'next/server';
import { rollbackLatestDeploymentCommit } from '@/lib/github/rollback';
import { orderStore } from '@/lib/order/store';

function splitOwnerRepo(value: string): { owner: string; repo: string } | null {
  const [owner, repo] = value.split('/');
  if (!owner || !repo) return null;
  return { owner, repo };
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    // Optional body.
  }

  const order = await orderStore.findById(id);
  const repoFromOrder = typeof order?.deploy?.githubRepository === 'string'
    ? splitOwnerRepo(order.deploy.githubRepository)
    : null;

  const owner =
    (typeof body.owner === 'string' ? body.owner : undefined) ??
    repoFromOrder?.owner;
  const repo =
    (typeof body.repo === 'string' ? body.repo : undefined) ??
    repoFromOrder?.repo;

  if (!owner || !repo) {
    return NextResponse.json(
      {
        error:
          'Missing repository coordinates. Provide { owner, repo } or persist deploy.githubRepository as "owner/repo".',
      },
      { status: 400 },
    );
  }

  const token =
    (typeof body.githubToken === 'string' ? body.githubToken : undefined) ??
    process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: 'Missing GitHub token. Provide githubToken in body or set GITHUB_TOKEN.' },
      { status: 400 },
    );
  }

  const branch =
    (typeof body.branch === 'string' ? body.branch : undefined) ??
    (typeof order?.deploy?.githubBranch === 'string' ? order.deploy.githubBranch : undefined) ??
    'main';

  const targetCommitSha =
    (typeof body.targetCommitSha === 'string' ? body.targetCommitSha : undefined) ??
    (typeof order?.deploy?.lastDeploymentCommitSha === 'string'
      ? order.deploy.lastDeploymentCommitSha
      : undefined);

  const allowNonHeadTarget = body.allowNonHeadTarget === true;

  try {
    const rollback = await rollbackLatestDeploymentCommit({
      owner,
      repo,
      token,
      branch,
      targetCommitSha,
      allowNonHeadTarget,
    });

    return NextResponse.json({
      ok: true,
      siteId: id,
      repository: `${owner}/${repo}`,
      ...rollback,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown rollback error';
    return NextResponse.json(
      {
        ok: false,
        error: message,
      },
      { status: 502 },
    );
  }
}
