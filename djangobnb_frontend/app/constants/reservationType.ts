export interface ReservationType {
  id: string;
  property: {
    id: number;
    title: string;
    images: Array<{ imageURL: string }>;
    timezone: string;
  };
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  created_at: string;
}
