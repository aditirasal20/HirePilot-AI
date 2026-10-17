import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import Page from "./Page";
import { recruiterDestination } from "../../utils/recruiter";
import {
  Panel,
  Button,
  Select,
  Notice,
  QueryState,
  Empty,
  Pager,
} from "../../components/candidate/ui";
import { usePageParams, useCandidateMutation } from "../../hooks/useCandidate";
import notificationApi from "../../api/notification.api";
import { QUERY_KEYS } from "../../config/constants";
import { formatDateTime } from "../../utils/format";
import { notificationDestination } from "../../utils/candidate";
export default function Notifications({ role = "candidate" }) {
  const { params, page, update } = usePageParams();
  const filter = params.get("filter") === "unread" ? "unread" : "all";
  const query = useQuery({
    queryKey: [...QUERY_KEYS.NOTIFICATIONS, { page, filter }],
    queryFn: () =>
      notificationApi.getNotifications({
        page,
        limit: 10,
        ...(filter === "unread" ? { isRead: false } : {}),
      }),
  });
  const count = useQuery({
    queryKey: QUERY_KEYS.UNREAD_COUNT,
    queryFn: notificationApi.getUnreadCount,
  });
  const keys = [QUERY_KEYS.NOTIFICATIONS, QUERY_KEYS.UNREAD_COUNT];
  const read = useCandidateMutation(notificationApi.markAsRead, keys);
  const all = useCandidateMutation(notificationApi.markAllAsRead, keys, () =>
    update({ page: null }),
  );
  const error = read.error || all.error;
  return (
    <Page
      eyebrow={
        role === "recruiter" ? "Your hiring workspace" : "Your career workspace"
      }
      title="Stay in the loop."
      description={
        count.isSuccess
          ? count.data +
            " unread update" +
            (count.data === 1 ? "" : "s") +
            " across your workspace."
          : "Updates from your applications, interviews, and AI tools."
      }
      actions={
        <Button
          variant="outline"
          disabled={!count.data || read.isPending}
          loading={all.isPending}
          onClick={() => all.mutate()}
        >
          Mark all as read
        </Button>
      }
    >
      {error && <Notice>{error.message}</Notice>}
      <Select
        label="Show notifications"
        value={filter}
        onChange={(e) =>
          update({
            filter: e.target.value === "all" ? null : e.target.value,
            page: null,
          })
        }
      >
        <option value="all">All updates</option>
        <option value="unread">Unread only</option>
      </Select>
      <QueryState query={query}>
        {query.data?.notifications.length ? (
          <div className="c-stack">
            {query.data.notifications.map((n) => {
              const to =
                role === "recruiter"
                  ? recruiterDestination(n)
                  : notificationDestination(n);
              return (
                <article
                  className={"c-notification" + (!n.isRead ? " is-unread" : "")}
                  key={n.id}
                >
                  <div>
                    <h3>
                      {n.title}
                      {!n.isRead && <span className="sr-only"> (unread)</span>}
                    </h3>
                    <p>{n.message}</p>
                    <time dateTime={n.createdAt}>
                      {formatDateTime(n.createdAt)}
                    </time>
                  </div>
                  <div className="c-actions">
                    {to && (
                      <Link className="c-text-link" to={to}>
                        View details
                      </Link>
                    )}
                    {!n.isRead && (
                      <Button
                        variant="outline"
                        disabled={read.isPending || all.isPending}
                        onClick={() => read.mutate(n.id)}
                      >
                        Mark as read
                      </Button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <Panel>
            <Empty
              title={
                filter === "unread" ? "You're all caught up" : "No updates yet"
              }
              description="Application progress, interview invitations, and AI results will appear here."
            />
          </Panel>
        )}
        {query.data && (
          <Pager
            pagination={query.data.pagination}
            page={page}
            onChange={(p) => update({ page: p })}
          />
        )}
      </QueryState>
    </Page>
  );
}
