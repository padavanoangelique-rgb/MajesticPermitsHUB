# How to create a Contractor account

1. In Supabase go to **Authentication → Users → Add user**
   - Enter the contractor’s email and a temporary password
   - Copy the new user’s UUID

2. In the SQL Editor run:

```sql
insert into contractors (name, email, company_name, auth_user_id)
values (
  'John Smith',
  'john@contractor.com',
  'Smith Construction',
  'PASTE-THE-AUTH-USER-UUID-HERE'
);
```

3. When creating a job in Admin, set **Client type = Contractor** and later we will add a dropdown to pick the contractor. For now you can update the job:

```sql
update jobs
set contractor_id = 'THE-CONTRACTOR-ID'
where id = 'THE-JOB-ID';
```

The contractor can now log in at /login and will only see their own jobs.
