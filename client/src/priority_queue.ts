interface PriorityQueue<T> {
    insert(item: T, priority: number): void
    peek(): T
    pop(): T
    size(): number
    isEmpty(): boolean
  }

interface NodePQ<T> {
    key: number
    value: T
  }

  export const priorityQueue = <T>(): PriorityQueue<T> => {
    let heap: NodePQ<T>[] = []
  
    const parent = (index: number) => Math.floor((index - 1) / 2)
    const left = (index: number) => 2 * index + 1
    const right = (index: number) =>  2 * index + 2
    const hasLeft = (index: number) => left(index) < heap.length
    const hasRight = (index: number) => right(index) < heap.length
  
    const swap = (a: number, b: number) => {
      const tmp = heap[a]
      heap[a] = heap[b]
      heap[b] = tmp
    }
    /** */
  
    return {
        isEmpty: () => heap.length == 0,
        peek: () => heap.length == 0 ? null : heap[0].value,
        size: () => heap.length,
        insert: (item, prio) => {
            heap.push({key: prio, value: item})
      
            let i = heap.length -1
            while(i > 0) {
              const p = parent(i)
              if(heap[p].key < heap[i].key) break
              const tmp = heap[i]
              heap[i] = heap[p]
              heap[p] = tmp
              i = p
            }
          },
      pop: () => {
        if(heap.length == 0) return null
        
        swap(0, heap.length - 1)
        const item = heap.pop()
  
        let current = 0
        while(hasLeft(current)) {
          let smallerChild = left(current)
          if(hasRight(current) && heap[right(current)].key < heap[left(current)].key) 
            smallerChild = right(current)
  
          if(heap[smallerChild].key > heap[current].key) break
  
          swap(current, smallerChild)
          current = smallerChild
        }
  
        return item.value
      }
    }
  }