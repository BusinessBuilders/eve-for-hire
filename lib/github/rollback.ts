interface GitCommitParent {
  sha: string;
}

interface GitCommitResponse {
  sha: string;
  commit: {
    tree: {
      sha: string;
    };
  };
  parents: GitCommitParent[];
}

interface BranchResponse {
  commit: {
    sha: string;
  };
}

interface CreateCommitResponse {
  sha: string;
}

export interface GithubRollbackInput {
  owner: string;
  repo: string;
  token: string;
  branch?: string;
  targetCommitSha?: string;
  allowNonHeadTarget?: boolean;
  apiBaseUrl?: string;
}

export interface GithubRollbackResult {
  branch: string;
  revertedCommitSha: string;
  restoredTreeFromCommitSha: string;
  rollbackCommitSha: string;
}

async function githubRequest<T>(
  url: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    throw new Error(`GitHub API ${res.status}: ${errorText.slice(0, 300)}`);
  }

  return (await res.json()) as T;
}

/**
 * Roll back by creating a new commit whose tree matches the target state.
 * This preserves history and avoids force-pushing.
 *
 * If input.targetCommitSha is provided, we restore the tree to exactly that commit.
 * If not provided, we rollback the latest commit (revert head to its parent).
 */
export async function rollbackLatestDeploymentCommit(
  input: GithubRollbackInput,
): Promise<GithubRollbackResult> {
  const branch = input.branch ?? 'main';
  const apiBase = (input.apiBaseUrl ?? 'https://api.github.com').replace(/\/$/, '');
  const baseRepoUrl = `${apiBase}/repos/${encodeURIComponent(input.owner)}/${encodeURIComponent(input.repo)}`;

  const branchData = await githubRequest<BranchResponse>(
    `${baseRepoUrl}/branches/${encodeURIComponent(branch)}`,
    input.token,
  );
  const headSha = branchData.commit.sha;

  let targetTreeSha: string;
  let targetSha: string;
  let message: string;
  let restoredFrom: string;

  if (input.targetCommitSha) {
    // Mode: Restore to specific commit.
    targetSha = input.targetCommitSha;
    const targetCommit = await githubRequest<GitCommitResponse>(
      `${baseRepoUrl}/commits/${encodeURIComponent(targetSha)}`,
      input.token,
    );
    targetTreeSha = targetCommit.commit.tree.sha;
    message = `revert: restore tree to commit ${targetSha}`;
    restoredFrom = targetSha;
  } else {
    // Mode: Rollback latest commit (revert head to parent).
    targetSha = headSha;
    const headCommit = await githubRequest<GitCommitResponse>(
      `${baseRepoUrl}/commits/${encodeURIComponent(headSha)}`,
      input.token,
    );
    const parent = headCommit.parents[0];
    if (!parent) {
      throw new Error('Head commit has no parent; cannot rollback initial commit');
    }

    const parentCommit = await githubRequest<GitCommitResponse>(
      `${baseRepoUrl}/commits/${encodeURIComponent(parent.sha)}`,
      input.token,
    );
    targetTreeSha = parentCommit.commit.tree.sha;
    message = `revert: rollback deployment commit ${headSha}`;
    restoredFrom = parent.sha;
  }

  if (!input.allowNonHeadTarget && input.targetCommitSha && input.targetCommitSha !== headSha) {
    // In "restore to" mode, we allow it to be different from head only if explicitly permitted.
    // This prevents accidental rollbacks to very old versions.
    throw new Error(
      `Target commit ${input.targetCommitSha} is not current head ${headSha}; pass allowNonHeadTarget=true to confirm restore.`,
    );
  }

  const rollbackCommit = await githubRequest<CreateCommitResponse>(
    `${baseRepoUrl}/git/commits`,
    input.token,
    {
      method: 'POST',
      body: JSON.stringify({
        message,
        tree: targetTreeSha,
        parents: [headSha],
      }),
    },
  );

  await githubRequest<{ ref: string; object: { sha: string } }>(
    `${baseRepoUrl}/git/refs/heads/${encodeURIComponent(branch)}`,
    input.token,
    {
      method: 'PATCH',
      body: JSON.stringify({
        sha: rollbackCommit.sha,
        force: false,
      }),
    },
  );

  return {
    branch,
    revertedCommitSha: targetSha,
    restoredTreeFromCommitSha: restoredFrom,
    rollbackCommitSha: rollbackCommit.sha,
  };
}
