-- Apply this once to reduce existing gallery bucket limits to 1 MB.
update storage.buckets
set file_size_limit = 1048576
where id in ('gallery-submissions', 'gallery-images');
