import { useState } from "react";
import Table from "../../components/table/table";
import TableHeader from "../../components/table/tableHeader";
import TableRow from "../../components/table/TableRow";
import type { PlayerStats, Column } from "../../components/table/tableHeader";

const dummyStats: PlayerStats[] = [
  {
    id: "1",
    name: "Chris Ramsell",
    number: 9,
    firstApps: 12,
    firstGoals: 8,
    secondApps: 3,
    secondGoals: 2,
    totalApps: 15,
    totalGoals: 10,
    preApps: 20,
    preGoals: 12,
    careerApps: 35,
    careerGoals: 22,
  },
  {
    id:"2",
    name: "Adam Tucker",
    number: 4,
    firstApps: 10,
    firstGoals: 1,
    secondApps: 5,
    secondGoals: 0,
    totalApps: 15,
    totalGoals: 1,
    preApps: 18,
    preGoals: 2,
    careerApps: 33,
    careerGoals: 3,
  },
];

const columns: Column[] = [
  { label: "Name", key: "name" },
  { label: "No.", key: "number" },
  { label: "1st Apps", key: "firstApps" },
  { label: "1st Goals", key: "firstGoals" },
  { label: "2nd Apps", key: "secondApps" },
  { label: "2nd Goals", key: "secondGoals" },
  { label: "Total Apps", key: "totalApps" },
  { label: "Total Goals", key: "totalGoals" },
  { label: "Pre 26/27 Apps", key: "preApps" },
  { label: "Pre 26/27 Goals", key: "preGoals" },
  { label: "Career Apps", key: "careerApps" },
  { label: "Career Goals", key: "careerGoals" },
];


export default function Stats() {
    const [sortKey, setSortKey] = useState<keyof PlayerStats>("name");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const handleSort = (key: keyof PlayerStats) => {
        if (key === sortKey) {
          setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
          setSortKey(key);
          setSortDirection("asc");
        }
    };

    const sortedData = [...dummyStats].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (typeof aVal === "number" && typeof bVal === "number") {
        return sortDirection === "asc" ? aVal - bVal : bVal - aVal;
    }

    return sortDirection === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });

  return (
    <Table>
      <TableHeader
        columns={columns}
        onSort={handleSort}
        sortKey={sortKey}
        sortDirection={sortDirection}
      />

      <tbody>
        {sortedData.map((player, index) => (
          <TableRow key={index} player={player} />
        ))}
      </tbody>
    </Table>
  );
}