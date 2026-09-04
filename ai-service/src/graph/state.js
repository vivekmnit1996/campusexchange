import { Annotation } from '@langchain/langgraph';

export const AgentState = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  isOnTopic: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => true,
  }),
  refusalReason: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => '',
  }),
  intent: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => 'general',
  }),
  retrievedData: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => ({ products: [], stores: [], orders: [], policy: null }),
  }),
  userContext: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => ({}),
  }),
  recommendedProducts: Annotation({
    reducer: (x, y) => (y !== undefined ? y : x),
    default: () => [],
  }),
});
