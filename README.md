# TaskSpace — Task Manager

A full-stack task management app: Django REST Framework backend with JWT auth,
React + TypeScript frontend.

## Features

- User registration, login (JWT), logout, password reset
- Full CRUD on tasks (title, description, priority, status, due date)
- Tasks are scoped per-user — everyone only sees their own
- Optional filtering by `status` / `priority` via query params

## Tech Stack

- **Backend**: Django, Django REST Framework, `djangorestframework-simplejwt`
- **Frontend**: React, TypeScript, Vite
- **Database**: (SQLite by default / swap in Postgres for production)

---

## Setup

### Backend

```bash
pip install django djangorestframework djangorestframework-simplejwt 
or pip freeze then pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd react
npm install
npm run dev
```

By default the frontend expects the API at `http://127.0.0.1:8000/api/ but this is http://127.0.0.1:9000/api/` (see `src/api.ts`).

---

## API Endpoints

| Method    | Endpoint                         | Description                                                     |
| --------- | -------------------------------- | --------------------------------------------------------------- |
| POST      | `/api/register/`               | Create a new user account                                       |
| POST      | `/api/token/`                  | Log in, returns access/refresh JWT                              |
| POST      | `/api/token/refresh/`          | Exchange refresh token for new access token                     |
| POST      | `/api/password-reset/`         | Request a password reset email                                  |
| POST      | `/api/password-reset/confirm/` | Confirm reset with hash/secret/new password                     |
| GET       | `/api/tasks/`                  | List current user's tasks (supports`?status=` `?priority=`) |
| POST      | `/api/tasks/`                  | Create a task                                                   |
| GET       | `/api/tasks/{id}/`             | Retrieve a single task                                          |
| PUT/PATCH | `/api/tasks/{id}/`             | Update a task                                                   |
| DELETE    | `/api/tasks/{id}/`             | Delete a task                                                   |

---

## Schema Design

A single `Task` model, owned by Django's built-in `User` model:

```python
class Task(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default="")
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_user', null=True, blank=True)
    due_date = models.DateField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    updated_at = models.DateTimeField(auto_now=True)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium', db_index=True)
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='to-do', db_index=True)
```

**Design decisions:**

- **`priority`/`status` as `CharField` with `choices=`, not separate lookup tables.** Both are small, fixed, rarely-changing enumerations (3 values each). A normalized `Priority`/`Status` table with a foreign key would add a join for no real benefit here — `choices` gives the same validation and a human-readable label (`get_status_display()`) without the extra table or join cost. This is a case where denormalizing an enum is the right call, not a shortcut.
- **`description` is optional (`blank=True`)** rather than required — a task manager shouldn't force users to write a description just to jot down a title.
- **Soft-delete groundwork**: `deleted_at` exists (nullable) so tasks can eventually be soft-deleted instead of hard-deleted, without needing a schema change later.

## Relationships

- **User → Task is one-to-many**: one `User` can own many `Task`s, each `Task` belongs to exactly one `User` (or none, since `user` is nullable — useful for system/imported tasks with no owner).
- **`on_delete=models.CASCADE`**: deleting a user deletes their tasks. This was a deliberate choice — an alternative would be `SET_NULL` to preserve historical tasks after account deletion, but for a personal task manager, orphaned tasks aren't meaningful, so cascading delete keeps the data model clean.
- **`related_name='task_user'`** lets you traverse the relationship from the user side: `some_user.task_user.all()` returns all their tasks, without needing a separate query against `Task`.

## Query Efficiency

A few concrete choices made for performance, not just correctness:

1. **`select_related('user')` on the list endpoint.** The serializer exposes `user.username` via `source='user.username'`. Without `select_related`, DRF would issue one extra query *per task* to fetch the related user (classic N+1) — with 50 tasks, that's 51 queries instead of 1. `select_related` performs a SQL `JOIN` up front, so it stays at 1 query regardless of list size.
2. **`db_index=True` on `status`, `priority`, and `created_at`.** These are the three columns actually used in `WHERE` (via `?status=`/`?priority=` filters) and `ORDER BY` (`-created_at`) on the list endpoint. Indexing exactly the columns used in filtering/sorting — and not indexing columns that aren't queried against — keeps write performance from degrading while still speeding up the reads that matter. (The `user` foreign key is auto-indexed by Django, since FK lookups are almost always filtered on.)
3. **Queryset is always scoped to `request.user` first** (`Task.objects.filter(user=request.user)`), so the FK index does the heavy lifting before any other filter is applied — every user's task list stays small regardless of total table size.

## Use of Migrations

Every schema change went through Django's migration system rather than hand-editing the database, which keeps the schema versioned and reproducible:

- **Initial migration** created the `Task` table with the original field set.
- **A follow-up migration** was needed after discovering `priority`/`status` were declared as bare `CharField()` with no `max_length` and no `choices` attached — adding both required `makemigrations` to generate a schema-altering migration (`AlterField`)
- **Another migration** changed `description` from required to `blank=True, default=""`, and changed `due_date` from `auto_now_add=True` (silently set to creation date, never editable) to a plain nullable `DateField` the user can actually set.

Commands used at each step:

```bash
python manage.py makemigrations   # generates the migration file from model changes
python manage.py sqlmigrate app_name 0002   # inspect the actual SQL before applying (optional, good habit)
python manage.py migrate          # applies it to the database
```

Keeping migrations small and one-concern-at-a-time (rather than batching unrelated model changes into one migration) makes it easier to roll back a single change if something goes wrong, and makes the migration history double as a changelog of how the schema evolved and why.
