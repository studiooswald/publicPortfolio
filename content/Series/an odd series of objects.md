---
SeriesName: an odd series of objects
StartYear: 2024
Status: ongoing
Instagram: No
Instagram-Text: 
---

## Über die Serie

*Beschreibung der Serie hier einfügen*

## Werke in dieser Serie

```dataview
TABLE WITHOUT ID
	file.link as "Werk",
	Year,
	Dimensions,
	Sold,
	Location
FROM #BodyOfWork
WHERE Series = "an odd series of objects"
SORT Year DESC
```

## Gezeigt in

```dataview
LIST
FROM "Exhibitions"
WHERE contains(file.outlinks, this.file.link)
```
