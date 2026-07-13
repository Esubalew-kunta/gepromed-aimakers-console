/** Contract-template type shared by server + client. */
export interface ContractTemplate {
  id: string;
  name: string;
  file_url: string | null;
  is_default: boolean;
  active: boolean;
  created_at: string;
  /** Courses (training ids) this contract covers — drives the auto-match. */
  course_ids: string[];
}
