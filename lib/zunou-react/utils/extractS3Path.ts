export const extractS3Path = (s3Url: string) => {
  const url = new URL(s3Url)

  // Remove the domain prefix, leaving only the key.
  return url.pathname.substring(1)
}
