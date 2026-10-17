import { useQuery } from "@tanstack/react-query";
import companyApi from "../api/company.api";
import jobApi from "../api/job.api";
import { QUERY_KEYS } from "../config/constants";
export {
  useCandidateMutation as useWorkspaceMutation,
  usePageParams,
} from "./useCandidate";
export const hiringKeys = [
  QUERY_KEYS.MY_JOBS,
  QUERY_KEYS.JOB_APPLICATIONS,
  [QUERY_KEYS.APPLICATION_DETAIL],
  QUERY_KEYS.INTERVIEWS,
  QUERY_KEYS.RECRUITER_DASHBOARD,
  QUERY_KEYS.NOTIFICATIONS,
  QUERY_KEYS.UNREAD_COUNT,
];
export function useCompany() {
  return useQuery({
    queryKey: QUERY_KEYS.COMPANY,
    queryFn: async () => {
      try {
        return await companyApi.getMyCompany();
      } catch (e) {
        if (e.status === 404) return null;
        throw e;
      }
    },
  });
}
export function useJob(jobId) {
  return useQuery({
    queryKey: [QUERY_KEYS.JOB_DETAIL, jobId],
    queryFn: () => jobApi.getJobById(jobId),
    enabled: !!jobId,
  });
}
