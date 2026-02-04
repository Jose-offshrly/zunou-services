import { useEffect, useState } from 'react'

const DB_NAME = 'vitalsBackgroundDB'
const STORE_NAME = 'userImages'
const DB_VERSION = 1

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result)
    }

    request.onerror = (event) => {
      reject(
        new Error(
          `Failed to open database: ${(event.target as IDBOpenDBRequest).error}`,
        ),
      )
    }
  })
}

interface BackgroundImage {
  id: string
  dataUrl: string
  createdAt: number
  name?: string
}

export const useBackgroundImages = (userId: string) => {
  const [images, setImages] = useState<BackgroundImage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const generateImageId = () => {
    return `img_${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  const loadImages = async () => {
    try {
      setIsLoading(true)
      const db = await openDB()
      const transaction = db.transaction(STORE_NAME, 'readonly')
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      return new Promise<BackgroundImage[]>((resolve, reject) => {
        request.onsuccess = () => {
          const allImages = request.result || []
          const userImages = allImages.filter((img: BackgroundImage) =>
            img.id.includes(userId),
          )
          userImages.sort((a, b) => b.createdAt - a.createdAt)

          setImages(userImages)
          setIsLoading(false)
          resolve(userImages)
          db.close()
        }

        request.onerror = () => {
          setIsLoading(false)
          reject(new Error(`Failed to load images: ${request.error}`))
          db.close()
        }
      })
    } catch (error) {
      console.error('Error loading images from IndexedDB:', error)
      setIsLoading(false)
      return []
    }
  }

  const saveImage = async (
    dataUrl: string,
    name = 'Uploaded Image',
  ): Promise<string> => {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Image saving timed out')), 5000)
      })

      const savePromise = (async () => {
        const db = await openDB()
        const transaction = db.transaction(STORE_NAME, 'readwrite')
        const store = transaction.objectStore(STORE_NAME)

        const imageId = generateImageId()
        const newImage: BackgroundImage = {
          createdAt: Date.now(),
          dataUrl,
          id: imageId,
          name,
        }

        return new Promise<string>((resolve, reject) => {
          const request = store.add(newImage)

          request.onsuccess = () => {
            loadImages().catch(console.error)
            db.close()
            resolve(imageId)
          }

          request.onerror = () => {
            db.close()
            reject(new Error(`Failed to save image: ${request.error}`))
          }

          transaction.oncomplete = () => {
            if (!request.result) resolve(imageId)
          }

          transaction.onabort = () => {
            reject(new Error('Transaction was aborted'))
          }
        })
      })()

      return Promise.race([savePromise, timeoutPromise])
    } catch (error) {
      console.error('Error saving image to IndexedDB:', error)
      throw error
    }
  }

  const deleteImage = async (imageId: string): Promise<void> => {
    try {
      const db = await openDB()
      const transaction = db.transaction(STORE_NAME, 'readwrite')
      const store = transaction.objectStore(STORE_NAME)

      return new Promise<void>((resolve, reject) => {
        const request = store.delete(imageId)

        request.onsuccess = () => {
          loadImages()
          db.close()
          resolve()
        }

        request.onerror = () => {
          db.close()
          reject(new Error(`Failed to delete image: ${request.error}`))
        }
      })
    } catch (error) {
      console.error('Error deleting image from IndexedDB:', error)
      throw error
    }
  }

  useEffect(() => {
    if (userId) {
      loadImages()
    }
  }, [userId])

  return {
    deleteImage,
    images,
    isLoading,
    loadImages,
    saveImage,
  }
}
