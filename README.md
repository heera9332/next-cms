# NextCMS

## supabase

project name - nextcms
project password - $d6c32_@wDASkV$


## Create Next.js 15 app (TS)
bunx create-next-app@15.2.0 . \
  --ts --eslint --src-dir --app --import-alias "@/*" --use-bun


## Roles CMS

## CMS Convention

api response format, when we have many items at time we return as 

```json
{
  "docs": [],
  "page": 1,
  "limit": 20,
  "total": 21,
  "totalPages": 2,
  "hasPrev": false,
  "hasNext": true,
  "q": "",
  "status": "all",
  "type": "post"
}
```

