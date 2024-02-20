import { currentInstance } from './component'

export function provide(key, value) {
  if (!currentInstance) return
  const parentProvides =
    currentInstance.parent && currentInstance.parent.provides
  let provides = currentInstance.provides
  if (parentProvides === provides) {
    provides = currentInstance.provides = Object.create(provides)
  }
  provides[key] = value
}
export function inject(key, defaultVal) {
  if (!currentInstance) return
  const provides = currentInstance.parent.provides
  if (!provides) {
    return defaultVal
  }
  if (provides && provides[key]) {
    return provides[key]
  } else {
    return defaultVal
  }
}
