import { inquiryOptions } from "@/lib/explore";

export function InterestOptions({ placeholder = false }: { placeholder?: boolean }) {
  return <>{placeholder && <option value="">선택해주세요</option>}
    {inquiryOptions.map(({ group, options }) => {
      const items = options.map(option => <option key={option.id} value={option.id}>{option.label}</option>);
      return group ? <optgroup key={group} label={group}>{items}</optgroup> : items;
    })}
  </>;
}
