// Enable File Stash by default unless explicitly disabled
export const enableFileStash =
  process.env.NEXT_PUBLIC_ENABLE_FILE_STASH === 'true'
    ? true
    : process.env.NEXT_PUBLIC_ENABLE_FILE_STASH === 'false'
      ? false
      : true;
