import { createPublicContentRoute } from '@/lib/social-preview/content-page';

const route = createPublicContentRoute('portal');

export const generateMetadata = route.generateMetadata;
export default route.Page;
