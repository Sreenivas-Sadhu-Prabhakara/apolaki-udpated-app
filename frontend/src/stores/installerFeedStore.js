import { defineStore } from 'pinia'
import { ref } from 'vue'
import { installerFeedApi } from '../services/installerFeedApi'

/**
 * Installer Feed store (Pinia setup style).
 *
 * Wraps installerFeedApi. Holds the anonymised global feed (with cursor
 * pagination), the currently-viewed post, the currently-viewed installer
 * profile, and the calling contractor's installations for the "Post an
 * install" flow. All responses are server-anonymised unless the viewer is
 * revealed for that post.
 */
export const useInstallerFeedStore = defineStore('installerFeed', () => {
  const items = ref([])
  const nextCursor = ref(null)
  const currentPost = ref(null)
  const currentProfile = ref(null)
  const myInstallations = ref([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const error = ref(null)

  function errMsg(err, fallback) {
    return err.response?.data?.error || fallback
  }

  /** Load the first page of the feed (replaces existing items). */
  const loadFeed = async ({ limit } = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await installerFeedApi.getFeed({ limit })
      const data = response.data.data || {}
      items.value = data.items || []
      nextCursor.value = data.nextCursor ?? null
      return items.value
    } catch (err) {
      error.value = errMsg(err, 'Failed to load the installer feed')
      return []
    } finally {
      loading.value = false
    }
  }

  /** Append the next page using the current cursor (no-op if exhausted). */
  const loadMore = async ({ limit } = {}) => {
    if (!nextCursor.value || loadingMore.value) return items.value
    loadingMore.value = true
    error.value = null
    try {
      const response = await installerFeedApi.getFeed({ cursor: nextCursor.value, limit })
      const data = response.data.data || {}
      items.value = items.value.concat(data.items || [])
      nextCursor.value = data.nextCursor ?? null
      return items.value
    } catch (err) {
      error.value = errMsg(err, 'Failed to load more posts')
      return items.value
    } finally {
      loadingMore.value = false
    }
  }

  /** Load a single post card by id. */
  const loadPost = async (postId) => {
    loading.value = true
    error.value = null
    try {
      const response = await installerFeedApi.getPost(postId)
      currentPost.value = response.data.data || null
      return currentPost.value
    } catch (err) {
      error.value = errMsg(err, 'Failed to load this post')
      currentPost.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  /** Load an anonymised installer profile (+ their posts) by public handle. */
  const loadProfile = async (handle) => {
    loading.value = true
    error.value = null
    try {
      const response = await installerFeedApi.getInstallerProfile(handle)
      currentProfile.value = response.data.data || null
      return currentProfile.value
    } catch (err) {
      error.value = errMsg(err, 'Failed to load this installer profile')
      currentProfile.value = null
      return null
    } finally {
      loading.value = false
    }
  }

  /** Load installations the calling contractor commissioned. */
  const loadMyInstallations = async () => {
    loading.value = true
    error.value = null
    try {
      const response = await installerFeedApi.getMyInstallations()
      myInstallations.value = response.data.data || []
      return myInstallations.value
    } catch (err) {
      error.value = errMsg(err, 'Failed to load your installations')
      myInstallations.value = []
      return []
    } finally {
      loading.value = false
    }
  }

  /** Create a post for one of my installations and prepend it to the feed. */
  const createPost = async ({ installationId, caption } = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await installerFeedApi.createPost({ installationId, caption })
      const post = response.data.data
      if (post) {
        items.value.unshift(post)
        currentPost.value = post
        // Mark the source installation as posted in the local list.
        const inst = myInstallations.value.find(i => i.installationId === installationId)
        if (inst) {
          inst.alreadyPosted = true
          inst.postId = post.id
        }
      }
      return post
    } catch (err) {
      error.value = errMsg(err, 'Failed to create the post')
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Patch caption/status of a post; refresh it everywhere it appears. */
  const updatePost = async (postId, { caption, status } = {}) => {
    loading.value = true
    error.value = null
    try {
      const response = await installerFeedApi.updatePost(postId, { caption, status })
      const post = response.data.data
      if (post) {
        const index = items.value.findIndex(p => p.id === postId)
        if (index !== -1) items.value.splice(index, 1, post)
        if (currentPost.value?.id === postId) currentPost.value = post
      }
      return post
    } catch (err) {
      error.value = errMsg(err, 'Failed to update the post')
      throw err
    } finally {
      loading.value = false
    }
  }

  /** Delete a post; drop it from the feed and clear local installation link. */
  const deletePost = async (postId) => {
    loading.value = true
    error.value = null
    try {
      await installerFeedApi.deletePost(postId)
      const index = items.value.findIndex(p => p.id === postId)
      if (index !== -1) items.value.splice(index, 1)
      if (currentPost.value?.id === postId) currentPost.value = null
      const inst = myInstallations.value.find(i => i.postId === postId)
      if (inst) {
        inst.alreadyPosted = false
        inst.postId = null
      }
      return true
    } catch (err) {
      error.value = errMsg(err, 'Failed to delete the post')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    // state
    items,
    nextCursor,
    currentPost,
    currentProfile,
    myInstallations,
    loading,
    loadingMore,
    error,
    // actions
    loadFeed,
    loadMore,
    loadPost,
    loadProfile,
    loadMyInstallations,
    createPost,
    updatePost,
    deletePost
  }
})

export default useInstallerFeedStore
