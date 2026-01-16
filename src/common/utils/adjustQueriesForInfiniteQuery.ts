import { Group } from 'src/modules/groups/entities/group.entity';

export function adjustQueriesForInfiniteQuery<
  Tobj extends object,
  ids = string,
>({
  idsToFilter,
  idsToInclude,
  searchInput,
  fieldToSearch,
  fieldToQuery,
}: {
  idsToFilter?: ids[];
  idsToInclude?: ids[];
  searchInput: string;
  fieldToSearch: keyof Tobj;
  fieldToQuery?: string;
}) {
  let queries: Record<any, any> = {};
  if (idsToFilter && idsToFilter.length > 0)
    queries = {
      _id: { $nin: idsToFilter },
    };
  else if (idsToInclude)
    queries = {
      _id: { $in: idsToInclude },
    };
  if (searchInput) {
    queries[fieldToSearch] = { $eq: searchInput };
  }
  if (fieldToQuery) {
  }
  return queries;
}
