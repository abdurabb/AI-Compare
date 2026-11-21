import { models, type ModelId } from "@/lib/models";

type ModelSelectProps = {
  id: string;
  value: ModelId;
  onChange: (modelId: ModelId) => void;
};

export function ModelSelect({ id, value, onChange }: ModelSelectProps) {
  return (
    <select
      id={id}
      value={value}
      aria-label="Model"
      onChange={(event) => onChange(event.target.value as ModelId)}
      className="w-full appearance-none rounded-lg border border-line bg-panel px-3 py-2 text-sm text-foreground outline-none transition focus:border-accent"
    >
      {models.map((model) => (
        <option key={model.id} value={model.id}>
          {model.name} · {model.detail}
        </option>
      ))}
    </select>
  );
}
