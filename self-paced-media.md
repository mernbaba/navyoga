# Self-Paced Class Media — Frontend Integration

## Flow

```
1. POST   /api/self-paced/modules/:moduleId/classes       → create class (video optional)
2. POST   /api/self-paced/modules/:moduleId/classes/:id/presign  → get upload URL
3. PUT    <presignedUrl>  (direct S3 upload from browser)
4. PATCH  /api/self-paced/modules/:moduleId/classes/:id   → save storePath in video field
```

---

## 1. Create Class

**POST** `/api/self-paced/modules/:moduleId/classes`

`video` is now optional — skip it and set it after upload.

---

## 2. Request Presigned Upload URL

**POST** `/api/self-paced/modules/:moduleId/classes/:id/presign`

```json
{ "filename": "lecture.mp4", "contentType": "video/mp4" }
```

Response:
```json
{
  "url": "https://bucket.s3.region.amazonaws.com/...",
  "storePath": "/self-paced/<CLASS_ID>/video.mp4",
  "expiresIn": 900
}
```

- `url` — PUT the file body here (no auth header needed)
- `storePath` — save this in the `video` field via PATCH after upload

---

## 3. Upload to S3

```js
await fetch(url, {
  method: "PUT",
  headers: { "Content-Type": "video/mp4" },
  body: file,
});
```

---

## 4. Save Path

**PATCH** `/api/self-paced/modules/:moduleId/classes/:id`

```json
{ "video": "/self-paced/<CLASS_ID>/video.mp4" }
```

The backend stores `storePath` as-is. The full CDN URL is assembled on the frontend:
```
https://cdn.example.com/<PREFIX>/self-paced/<CLASS_ID>/video.mp4
```

---

## Delete Media

**DELETE** `/api/self-paced/modules/:moduleId/classes/:id/media`

Removes the file from S3 and clears the `video` field. No body needed.

> Class deletion also purges the S3 file automatically.
