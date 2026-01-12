type RosterHeaderProps = {
  game: {
    title: string;
    skillBand: string; // intermediate
    intensityBand: string; //competitive [intensity]
    sportName: string;
    startTime: string;
    location: {
      name: string
    }
  } | null;
}

export function RosterHeader({ game }: RosterHeaderProps) {
  return (
    <div className="flex items-center text-center justify-center">
      Header
    </div>
  );
}
