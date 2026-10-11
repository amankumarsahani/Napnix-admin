// Block model for the NexMail template builder. Block = { id, type, settings }; the server
// compiles blocks_json to email HTML (nexmail/services/templateCompiler.js).

export const BLOCK_TYPES = [
    { type: 'header', label: 'Header' }, { type: 'text', label: 'Text' }, { type: 'image', label: 'Image' },
    { type: 'button', label: 'Button' }, { type: 'divider', label: 'Divider' }, { type: 'spacer', label: 'Spacer' },
    { type: 'columns2', label: '2 columns' }, { type: 'imageText', label: 'Image + text' }, { type: 'social', label: 'Social' },
    { type: 'footer', label: 'Footer' }, { type: 'video', label: 'Video' }, { type: 'testimonial', label: 'Testimonial' },
    { type: 'productCard', label: 'Product' }, { type: 'menu', label: 'Nav menu' }, { type: 'code', label: 'HTML' },
];

export const BLOCK_DEFAULTS = {
    header: { content: 'Your Company Name', backgroundColor: '#4f46e5', textColor: '#ffffff', padding: '24px', fontSize: '24px', align: 'center' },
    text: { content: '<p>Write your email content here. You can use <b>bold</b>, <i>italic</i>, and <a href="#">links</a>.</p>', padding: '20px', fontSize: '16px', textColor: '#333333' },
    image: { src: '', alt: 'Image', width: '100%', align: 'center', padding: '10px', link: '' },
    button: { text: 'Click Here', url: '#', backgroundColor: '#4f46e5', textColor: '#ffffff', borderRadius: '8px', align: 'center', fontSize: '16px' },
    divider: { color: '#e5e7eb', thickness: '1px', style: 'solid', padding: '10px 20px' },
    spacer: { height: '20px' },
    columns2: { split: '50-50', column1: '<p>Left column content</p>', column2: '<p>Right column content</p>', padding: '20px', gap: '20px' },
    imageText: { imageSrc: '', imageAlt: 'Image', imagePosition: 'left', content: '<p>Description goes here</p>', padding: '20px' },
    social: { align: 'center', padding: '20px', facebook: '', twitter: '', instagram: '', linkedin: '' },
    footer: { content: '&copy; 2026 {{company}}. All rights reserved.', textColor: '#999999', backgroundColor: '#f8f9fa', padding: '20px', showUnsubscribe: true },
    video: { videoUrl: '', thumbnailUrl: '', alt: 'Watch Video', padding: '20px' },
    testimonial: { quote: 'Amazing product!', author: 'Jane Doe', title: 'CEO', padding: '20px', backgroundColor: '#f8f9fa' },
    productCard: { productName: 'Product Name', price: '$99', imageUrl: '', description: 'Short description', buttonText: 'Shop Now', buttonUrl: '#', padding: '20px' },
    menu: { items: [{ text: 'Home', url: '#' }, { text: 'Shop', url: '#' }, { text: 'Contact', url: '#' }], align: 'center', padding: '15px', textColor: '#333', separator: '|' },
    code: { content: '<!-- Custom HTML -->' },
};

const ALIGN = [['left', 'Left'], ['center', 'Center'], ['right', 'Right']];

// Field kinds: text | color | select | area | mono (monospace textarea) | check
const t = (label, key, placeholder) => ({ kind: 'text', label, key, placeholder });
const c = (label, key) => ({ kind: 'color', label, key });
const sel = (label, key, options) => ({ kind: 'select', label, key, options });
const area = (label, key, rows = 4, mono = false) => ({ kind: mono ? 'mono' : 'area', label, key, rows });

export const BLOCK_FIELDS = {
    header: [t('Heading text', 'content'), c('Background', 'backgroundColor'), c('Text colour', 'textColor'), t('Logo URL', 'logoUrl', 'https://…'), sel('Alignment', 'align', ALIGN), t('Font size', 'fontSize', '24px'), t('Padding', 'padding', '24px')],
    text: [area('Content (HTML)', 'content', 8, true), c('Text colour', 'textColor'), t('Font size', 'fontSize'), t('Padding', 'padding')],
    image: [t('Image URL', 'src', 'https://…'), t('Alt text', 'alt'), t('Width', 'width', '100%'), t('Link URL', 'link', 'https://…'), sel('Alignment', 'align', ALIGN), t('Border radius', 'borderRadius', '0'), t('Padding', 'padding')],
    button: [t('Button text', 'text'), t('URL', 'url', 'https://…'), c('Background', 'backgroundColor'), c('Text colour', 'textColor'), t('Border radius', 'borderRadius'), sel('Alignment', 'align', ALIGN), t('Font size', 'fontSize')],
    divider: [c('Colour', 'color'), t('Thickness', 'thickness'), sel('Style', 'style', [['solid', 'Solid'], ['dashed', 'Dashed'], ['dotted', 'Dotted']]), t('Padding', 'padding')],
    spacer: [t('Height', 'height', '20px')],
    columns2: [sel('Column split', 'split', [['50-50', '50/50'], ['30-70', '30/70'], ['70-30', '70/30'], ['40-60', '40/60'], ['60-40', '60/40']]), area('Column 1 (HTML)', 'column1', 4, true), area('Column 2 (HTML)', 'column2', 4, true), t('Padding', 'padding'), t('Gap', 'gap')],
    imageText: [t('Image URL', 'imageSrc', 'https://…'), t('Image alt', 'imageAlt'), sel('Image position', 'imagePosition', [['left', 'Left'], ['right', 'Right']]), area('Text (HTML)', 'content', 4, true), t('Padding', 'padding')],
    social: [sel('Alignment', 'align', ALIGN), t('Facebook', 'facebook', 'https://facebook.com/…'), t('Twitter / X', 'twitter', 'https://x.com/…'), t('Instagram', 'instagram', 'https://instagram.com/…'), t('LinkedIn', 'linkedin', 'https://linkedin.com/…'), t('Padding', 'padding')],
    footer: [area('Footer content (HTML)', 'content', 3, true), c('Text colour', 'textColor'), c('Background', 'backgroundColor'), { kind: 'check', label: 'Show unsubscribe link', key: 'showUnsubscribe' }],
    video: [t('Video URL', 'videoUrl', 'https://youtube.com/watch?v=…'), t('Thumbnail URL', 'thumbnailUrl', 'Auto for YouTube'), t('Alt text', 'alt')],
    testimonial: [area('Quote', 'quote', 3), t('Author', 'author'), t('Title', 'title'), t('Avatar URL', 'avatarUrl', 'https://…'), c('Background', 'backgroundColor')],
    productCard: [t('Product name', 'productName'), t('Price', 'price'), t('Image URL', 'imageUrl'), area('Description', 'description', 3), t('Button text', 'buttonText'), t('Button URL', 'buttonUrl')],
    menu: [sel('Alignment', 'align', [['center', 'Center'], ['left', 'Left'], ['right', 'Right']]), c('Text colour', 'textColor'), t('Separator', 'separator')],
    code: [area('Raw HTML', 'content', 10, true)],
};

let counter = 0;
export const newBlockId = () => { counter += 1; return `block_${counter}_${Math.random().toString(36).slice(2, 8)}`; };
export const createBlock = type => ({ id: newBlockId(), type, settings: JSON.parse(JSON.stringify(BLOCK_DEFAULTS[type])) });
export const DEFAULT_BLOCKS = () => ['header', 'text', 'button', 'footer'].map(createBlock);
