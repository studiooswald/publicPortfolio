import type { QuartzComponent, QuartzComponentProps, SortFn } from "@quartz-community/types";
import { getDate, byDateAndAlphabetical } from "@quartz-community/utils/sort";
import { resolveRelative, isFolderPath } from "../util/path";
import type { FullSlug } from "../util/path";

export type { SortFn } from "@quartz-community/types";
export { byDateAndAlphabetical };

export function byDateAndAlphabeticalFolderFirst(_cfg: unknown): SortFn {
  return (f1, f2) => {
    const f1IsFolder = isFolderPath(f1.slug ?? "");
    const f2IsFolder = isFolderPath(f2.slug ?? "");
    if (f1IsFolder && !f2IsFolder) return -1;
    if (!f1IsFolder && f2IsFolder) return 1;

    if (f1.dates && f2.dates) {
      return (getDate(f2)?.getTime() ?? 0) - (getDate(f1)?.getTime() ?? 0);
    } else if (f1.dates && !f2.dates) {
      return -1;
    } else if (!f1.dates && f2.dates) {
      return 1;
    }
    const f1Title = f1.frontmatter?.title?.toLowerCase() ?? "";
    const f2Title = f2.frontmatter?.title?.toLowerCase() ?? "";
    return f1Title.localeCompare(f2Title);
  };
}

type PageListProps = {
  limit?: number;
  sort?: SortFn;
} & QuartzComponentProps;

export const PageList: QuartzComponent = ({
  cfg,
  fileData,
  allFiles,
  limit,
  sort,
}: PageListProps) => {
  const sorter = sort ?? byDateAndAlphabeticalFolderFirst(cfg);
  let list = [...allFiles].sort(sorter);
  if (limit) {
    list = list.slice(0, limit);
  }

  const fileSlug = (fileData as { slug?: string } | undefined)?.slug as FullSlug | undefined;

  return (
    <ul class="section-ul artwork-grid">
      {list.map((page) => {
        const title = page.frontmatter?.title;
        const tags = (page.frontmatter?.tags ?? []) as string[];
        const cover = page.frontmatter?.cover as string | undefined;
        const year = page.frontmatter?.Year as string | undefined;
        const dimensions = page.frontmatter?.Dimensions as string | undefined;

        return (
          <li class="section-li artwork-card">
            <a
              href={resolveRelative(fileSlug ?? ("" as FullSlug), page.slug as FullSlug)}
              class="internal artwork-link"
            >
              <div class="artwork-thumb">
                {cover
                  ? <img src={cover} alt={title as string} loading="lazy" />
                  : <div class="artwork-thumb-placeholder" />
                }
              </div>
              <div class="artwork-info">
                <p class="artwork-title">{title}</p>
                <p class="artwork-meta">
                  {year && <span>{year}</span>}
                  {dimensions && <span>{dimensions}</span>}
                </p>
                {tags.length > 0 && (
                  <p class="artwork-tags">{tags.join(', ')}</p>
                )}
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
};

PageList.css = `
.artwork-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
  list-style: none;
  padding: 0;
  margin-top: 1rem;
}

.artwork-card {
  display: block;
  border-radius: 4px;
  overflow: hidden;
  background: var(--light);
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  transition: box-shadow 0.2s ease;
}

.artwork-card:hover {
  box-shadow: 0 3px 12px rgba(0,0,0,0.12);
}

.artwork-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.artwork-thumb {
  width: 100%;
  aspect-ratio: 4/5;
  overflow: hidden;
  background: var(--lightgray);
}

.artwork-thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  transition: transform 0.3s ease;
}

.artwork-link:hover .artwork-thumb img {
  transform: scale(1.02);
}

.artwork-thumb-placeholder {
  width: 100%;
  height: 100%;
  background: var(--lightgray);
}

.artwork-info {
  padding: 0.7rem 0.8rem 0.6rem;
  background: var(--lightgray);
  border-top: 1px solid var(--lightgray);
}

.artwork-title {
  margin: 0 0 0.25rem;
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1.3;
  color: var(--dark);
}

.artwork-meta {
  font-size: 0.78rem;
  color: var(--darkgray);
  margin: 0;
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.artwork-meta span + span::before {
  content: '·';
  margin-right: 0.4rem;
}

.artwork-tags {
  font-size: 0.72rem;
  color: var(--gray);
  margin: 0.25rem 0 0;
  text-transform: lowercase;
}

@media (max-width: 600px) {
  .artwork-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.75rem;
  }
}
`;
