import Card from "../../../components/compositions/Card";

export default function UpcomingEvent() {
  return (
    <Card title="Next Match">
      <div className="flex justify-between items-center">
        <div>
          <p className="font-semibold">vs St Thomas Stars</p>
          <p className="text-sm text-gray-500">Saturday 2pm</p>
        </div>

        <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium">
          View
        </button>
      </div>
    </Card>
  );
}