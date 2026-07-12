---
---

## Alle Serien

```dataview
TABLE WITHOUT ID
	file.link as "Serie",
	StartYear as "Begonnen",
	Status
FROM "Body of Work/Series"
WHERE file.name != "Series"
SORT StartYear DESC
```

## an odd series of objects

```dataview
TABLE WITHOUT ID
	embed(link(file.outlinks[0])) as "Vorschau",
	file.link as "Werk",
	Year,
	Sold
FROM #BodyOfWork
WHERE Series = "an odd series of objects"
SORT Year DESC
```

## Ansichten (M)eines Körpers

```dataview
TABLE WITHOUT ID
	embed(link(file.outlinks[0])) as "Vorschau",
	file.link as "Werk",
	Year,
	Sold
FROM #BodyOfWork
WHERE Series = "Ansichten (M)eines Körpers"
SORT Year DESC
```

## When summer was gentle

```dataview
TABLE WITHOUT ID
	embed(link(file.outlinks[0])) as "Vorschau",
	file.link as "Werk",
	Year,
	Sold
FROM #BodyOfWork
WHERE Series = "When summer was gentle"
SORT Year DESC
```

## Whenever I get lost, I take a breath

```dataview
TABLE WITHOUT ID
	embed(link(file.outlinks[0])) as "Vorschau",
	file.link as "Werk",
	Year,
	Sold
FROM #BodyOfWork
WHERE Series = "Whenever I get lost, I take a breath"
SORT Year DESC
```

## Ein Frühling wie er nie war

```dataview
TABLE WITHOUT ID
	embed(link(file.outlinks[0])) as "Vorschau",
	file.link as "Werk",
	Year,
	Sold
FROM #BodyOfWork
WHERE Series = "Ein Frühling wie er nie war"
SORT Year DESC
```

## Winter

```dataview
TABLE WITHOUT ID
	embed(link(file.outlinks[0])) as "Vorschau",
	file.link as "Werk",
	Year,
	Sold
FROM #BodyOfWork
WHERE Series = "Winter"
SORT Year DESC
```

## Skizze

```dataview
TABLE WITHOUT ID
	embed(link(file.outlinks[0])) as "Vorschau",
	file.link as "Werk",
	Year,
	Sold
FROM #BodyOfWork
WHERE Series = "Skizze"
SORT Year DESC
```

## Werke ohne Serie

```dataview
TABLE WITHOUT ID
	file.link as "Werk",
	Year,
	Sold
FROM #BodyOfWork
WHERE Series = ""
SORT Year DESC
```
