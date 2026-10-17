import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import resumeApi from "../api/resume.api";
import { QUERY_KEYS, DEFAULT_QUERY_OPTIONS } from "../config/constants";
export function useResumes() {
  return useQuery({
    queryKey: QUERY_KEYS.RESUMES,
    queryFn: resumeApi.getMyResumes,
    ...DEFAULT_QUERY_OPTIONS,
  });
}
export function useCandidateMutation(fn, keys, onSuccess) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (variables) => fn(variables),
    onSuccess: (data, variables) => {
      keys.forEach((key) => client.invalidateQueries({ queryKey: key }));
      onSuccess?.(data, variables);
    },
  });
}
export function usePageParams() {
  const [params, setParams] = useSearchParams();
  const raw = Number(params.get("page"));
  const page = Number.isInteger(raw) && raw > 0 ? raw : 1;
  const update = (values) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      Object.entries(values).forEach(([key, value]) => {
        if (value == null || value === "") next.delete(key);
        else next.set(key, String(value));
      });
      return next;
    });
  return { params, page, update };
}
export function useSelectedResume() {
  const query = useResumes();
  const { params, update } = usePageParams();
  const resumes = query.data || [];
  const requested = params.get("resumeId");
  const selected =
    resumes.find((r) => r.id === requested) ||
    resumes.find((r) => r.isDefault) ||
    resumes[0];
  return { query, resumes, selected, select: (id) => update({ resumeId: id }) };
}
export const resumeKeys = [
  QUERY_KEYS.RESUMES,
  QUERY_KEYS.DASHBOARD,
  QUERY_KEYS.MY_MATCHES,
];
export const inProgress = (status) => ["QUEUED", "PROCESSING"].includes(status);
