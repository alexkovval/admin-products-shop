export interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  phone_number: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Customer[];
}

export interface CustomerListParams {
  search?: string;
  ordering?: string;
  page?: number;
}
