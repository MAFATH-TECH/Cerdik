alter table public.profiles add column if not exists phone text;

create unique index if not exists profiles_phone_unique_idx on public.profiles (phone)
where
    phone is not null
    and phone <> '';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, kelas, sekolah, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(new.raw_user_meta_data->>'name', ''), 'Pengguna CERDIK'),
    coalesce(nullif(new.raw_user_meta_data->>'kelas', ''), '-'),
    coalesce(nullif(new.raw_user_meta_data->>'sekolah', ''), '-'),
    coalesce(nullif(new.raw_user_meta_data->>'phone', ''), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        name = excluded.name,
        kelas = excluded.kelas,
        sekolah = excluded.sekolah,
        phone = excluded.phone,
        updated_at = timezone('utc'::text, now());

  return new;
end;
$$;

create or replace function public.check_registration_availability(p_email text, p_phone text)
returns table(email_taken boolean, phone_taken boolean)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  return query
  select
    exists(
      select 1
      from auth.users u
      where lower(u.email) = lower(coalesce(p_email, ''))
    ) as email_taken,
    exists(
      select 1
      from public.profiles p
      where p.phone = coalesce(p_phone, '')
        and coalesce(p.phone, '') <> ''
    ) as phone_taken;
end;
$$;

revoke all on function public.check_registration_availability (text, text)
from public;

grant
execute on function public.check_registration_availability (text, text) to anon,
authenticated;