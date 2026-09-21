-- Offer photos: the owner uploads pictures for offers, customers see them.
-- Policies live on storage.objects (the bucket row itself is owned by Cloud).

create policy "Offer photos are viewable by everyone"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'offer-photos');

create policy "Owner can upload offer photos"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'offer-photos'
  and public.has_role(auth.uid(), 'owner')
);

create policy "Owner can replace offer photos"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'offer-photos'
  and public.has_role(auth.uid(), 'owner')
)
with check (
  bucket_id = 'offer-photos'
  and public.has_role(auth.uid(), 'owner')
);

create policy "Owner can delete offer photos"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'offer-photos'
  and public.has_role(auth.uid(), 'owner')
);
