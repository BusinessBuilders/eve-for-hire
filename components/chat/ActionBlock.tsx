import { DomainResultsCard, type DomainResult } from './DomainResultsCard';
import { CheckoutCard, type CheckoutData } from './CheckoutCard';
import { DraftPreviewCard, type DraftPreviewData } from './DraftPreviewCard';

export type ActionData =
  | { type: 'domain-results'; keyword: string; results: DomainResult[]; error?: string }
  | ({ type: 'checkout-ready' } & CheckoutData)
  | ({ type: 'draft-preview' } & DraftPreviewData);

interface ActionBlockProps {
  raw: string;
  sessionId: string;
  onDomainSelect: (domain: string) => void;
}

export function ActionBlock({
  raw,
  sessionId,
  onDomainSelect,
}: ActionBlockProps) {
  let data: ActionData;
  try {
    data = JSON.parse(raw) as ActionData;
  } catch {
    return null; // malformed — render nothing
  }

  if (data.type === 'domain-results') {
    return (
      <DomainResultsCard
        keyword={data.keyword}
        results={data.results}
        error={data.error}
        onSelect={onDomainSelect}
      />
    );
  }
  if (data.type === 'checkout-ready') {
    return <CheckoutCard data={data} sessionId={sessionId} />;
  }
  if (data.type === 'draft-preview') {
    return <DraftPreviewCard data={data} />;
  }
  return null;
}
