export interface Member {
  id: string;
  name: string;
  hasWon: boolean;
  joinDate: string;
  saldo: number;
}

export interface ArisanRound {
  id: string;
  date: string;
  winnerId: string;
  winnerName: string;
}
