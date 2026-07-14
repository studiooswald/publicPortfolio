---
SeriesName: a sense of finding home
StartYear: 2026
Status: ongoing
---

## Über die Serie

*Beschreibung der Serie hier einfügen*

## Werke in dieser Serie

```dataview
TABLE WITHOUT ID
	embed(link(file.outlinks[0])) as "Vorschau",
	file.link as "Werk",
	Year,
	Dimensions,
	Sold
FROM #BodyOfWork
WHERE Series = "a sense of finding home"
SORT Year DESC
```

## Gezeigt in

```dataview
LIST
FROM "Exhibitions"
WHERE contains(file.outlinks, this.file.link)
```
