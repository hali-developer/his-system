export type RequestContext = {
  organizationId: string;
  branchId: string;
  userId: string;
  traceId?: string;
  permissions?: string[];
};
