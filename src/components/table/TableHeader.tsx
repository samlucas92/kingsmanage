export type Column = {
  label: string;
  key: keyof PlayerStats;
};

export type PlayerStats = {
  id:string;
  name: string;
  number: number;
  firstApps: number;
  firstGoals: number;
  secondApps: number;
  secondGoals: number;
  totalApps: number;
  totalGoals: number;
  preApps: number;
  preGoals: number;
  careerApps: number;
  careerGoals: number;
};

type Props = {
  columns: Column[];
  onSort: (key: keyof PlayerStats) => void;
  sortKey: string;
  sortDirection: "asc" | "desc";
};

export default function TableHeader({
  columns,
  onSort,
  sortKey,
  sortDirection,
}: Props) {
  return (
    <thead>
      <tr className="text-left border-b">
        {columns.map((col) => (
          <th
            key={col.key}
            className="p-2 cursor-pointer select-none"
            onClick={() => onSort(col.key)}
          >
            {col.label}
            {sortKey === col.key && (
              <span className="ml-1">
                {sortDirection === "asc" ? "↑" : "↓"}
              </span>
            )}
          </th>
        ))}
      </tr>
    </thead>
  );
}