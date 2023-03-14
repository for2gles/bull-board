"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queuesHandler = void 0;
const statuses_1 = require("../constants/statuses");
const formatJob = (job, queue) => {
    const jobProps = job.toJSON();
    const stacktrace = jobProps.stacktrace ? jobProps.stacktrace.filter(Boolean) : [];
    return {
        id: jobProps.id,
        timestamp: jobProps.timestamp,
        processedOn: jobProps.processedOn,
        finishedOn: jobProps.finishedOn,
        progress: jobProps.progress,
        attempts: jobProps.attemptsMade,
        delay: jobProps.delay,
        failedReason: jobProps.failedReason,
        stacktrace,
        opts: jobProps.opts,
        data: queue.format('data', jobProps.data),
        name: queue.format('name', jobProps, jobProps.name || ''),
        returnValue: queue.format('returnValue', jobProps.returnvalue),
        isFailed: !!jobProps.failedReason || (Array.isArray(stacktrace) && stacktrace.length > 0),
    };
};
const allStatuses = [
    statuses_1.STATUSES.active,
    statuses_1.STATUSES.completed,
    statuses_1.STATUSES.delayed,
    statuses_1.STATUSES.failed,
    statuses_1.STATUSES.paused,
    statuses_1.STATUSES.waiting,
];
function getPagination(statuses, counts, currentPage, jobsPerPage) {
    const isLatestStatus = statuses.length > 1;
    const total = isLatestStatus
        ? statuses.reduce((total, status) => total + Math.min(counts[status], jobsPerPage), 0)
        : counts[statuses[0]];
    const start = isLatestStatus ? 0 : (currentPage - 1) * jobsPerPage;
    const pageCount = isLatestStatus ? 1 : Math.ceil(total / jobsPerPage);
    return {
        pageCount,
        range: { start, end: start + jobsPerPage - 1 },
    };
}
async function getAppQueues(pairs, query) {
    return Promise.all(pairs.map(async ([queueName, queue]) => {
        const isActiveQueue = decodeURIComponent(query.activeQueue) === queueName;
        const jobsPerPage = +query.jobsPerPage || 10;
        const status = !isActiveQueue || query.status === 'latest' ? allStatuses : [query.status];
        const currentPage = +query.page || 1;
        const counts = await queue.getJobCounts(...allStatuses);
        const isPaused = await queue.isPaused();
        const pagination = getPagination(status, counts, currentPage, jobsPerPage);
        const jobs = isActiveQueue
            ? await queue.getJobs(status, pagination.range.start, pagination.range.end)
            : [];
        const description = queue.getDescription() || undefined;
        return {
            name: queueName,
            description,
            counts: counts,
            jobs: jobs.filter(Boolean).map((job) => formatJob(job, queue)),
            pagination,
            readOnlyMode: queue.readOnlyMode,
            allowRetries: queue.allowRetries,
            allowCompletedRetries: queue.allowCompletedRetries,
            isPaused,
        };
    }));
}
async function queuesHandler({ queues: bullBoardQueues, query = {}, }) {
    const pairs = [...bullBoardQueues.entries()];
    const queues = pairs.length > 0 ? await getAppQueues(pairs, query) : [];
    return {
        body: {
            queues,
        },
    };
}
exports.queuesHandler = queuesHandler;
//# sourceMappingURL=queues.js.map