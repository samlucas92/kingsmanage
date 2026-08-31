type Props = {
  player: {
    id: string;
    name: string;
    number?: number;
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
};

export default function TableRow({ player }: Props) {
  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-2 font-medium"><a href={`/players/${player.id}`}>{player.name}</a></td>
      <td className="p-2">{player.number}</td>
      <td className="p-2">{player.firstApps}</td>
      <td className="p-2">{player.firstGoals}</td>
      <td className="p-2">{player.secondApps}</td>
      <td className="p-2">{player.secondGoals}</td>
      <td className="p-2">{player.totalApps}</td>
      <td className="p-2">{player.totalGoals}</td>
      <td className="p-2">{player.preApps}</td>
      <td className="p-2">{player.preGoals}</td>
      <td className="p-2">{player.careerApps}</td>
      <td className="p-2">{player.careerGoals}</td>
    </tr>
  );
}
