import { createPublicContentRoute } from '@/lib/social-preview/content-page';

const route = createPublicContentRoute('place');

export const generateMetadata = route.generateMetadata;
export default route.Page;
