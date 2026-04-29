create or replace function public.normalize_phone(p_phone text)
returns text
language plpgsql
immutable
as $$
declare
  digits text;
begin
  digits := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');

  if digits = '' then
    return '';
  end if;

  if left(digits, 2) = '62' then
    return digits;
  end if;

  if left(digits, 1) = '0' then
    return '62' || substring(digits from 2);
  end if;

  if left(digits, 1) = '8' then
    return '62' || digits;
  end if;

  return digits;
end;
$$;

drop index if exists profiles_phone_unique_idx;

update public.profiles
set
    phone = public.normalize_phone (phone)
where
    coalesce(phone, '') <> '';

update public.profiles p
set
    phone = public.normalize_phone (
        u.raw_user_meta_data ->> 'phone'
    )
from auth.users u
where
    p.id = u.id
    and coalesce(p.phone, '') = ''
    and coalesce(
        u.raw_user_meta_data ->> 'phone',
        ''
    ) <> ''
    and not exists (
        select 1
        from public.profiles p2
        where
            p2.id <> p.id
            and public.normalize_phone (p2.phone) = public.normalize_phone (
                u.raw_user_meta_data ->> 'phone'
            )
            and coalesce(p2.phone, '') <> ''
    );

create unique index if not exists profiles_phone_normalized_unique_idx on public.profiles (
    public.normalize_phone (phone)
)
where
    coalesce(phone, '') <> '';

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
    public.normalize_phone(new.raw_user_meta_data->>'phone')
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
declare
  normalized_phone text;
begin
  normalized_phone := public.normalize_phone(p_phone);

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
      where public.normalize_phone(p.phone) = normalized_phone
        and normalized_phone <> ''
    ) or exists(
      select 1
      from auth.users u
      where public.normalize_phone(u.raw_user_meta_data->>'phone') = normalized_phone
        and normalized_phone <> ''
    ) as phone_taken;
end;
$$;

revoke all on function public.check_registration_availability (text, text)
from public;

grant
execute on function public.check_registration_availability (text, text) to anon,
authenticated;