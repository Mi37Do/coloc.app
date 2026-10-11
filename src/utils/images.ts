import { pickPhotos } from '@/lib/native'

/**
 * Lets the user choose image(s): the camera/gallery prompt in the app, the file picker in a
 * browser. Call it straight from a click handler (browsers only open pickers on a user gesture).
 * Resolves [] when cancelled.
 */
export async function chooseImages({ multiple = false } = {}): Promise<File[]> {
  const native = await pickPhotos()
  if (native) return native

  return new Promise((resolve) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = multiple
    input.onchange = () => resolve([...(input.files ?? [])])
    // Resolves [] if the dialog is dismissed (supported by current browsers)
    input.addEventListener('cancel', () => resolve([]))
    input.click()
  })
}

/** Centre-crops an image to a square JPEG, e.g. for profile pictures (keeps uploads small) */
export async function squareJpeg(file: File, size = 512): Promise<File> {
  const bitmap = await createImageBitmap(file)
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, size, size)
  bitmap.close()
  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read the image'))), 'image/jpeg', 0.88),
  )
  return new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
}
