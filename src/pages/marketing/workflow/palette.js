// Node palette for the workflow editor (and labels for the detail page)
export const NODE_PALETTE = {
    triggers: [
        { id: 'lead_created', label: 'Lead Created', type: 'trigger' },
        { id: 'client_created', label: 'Client Created', type: 'trigger' },
        { id: 'lead_status_changed', label: 'Lead Status Changed', type: 'trigger' },
        { id: 'client_status_changed', label: 'Client Status Changed', type: 'trigger' },
        { id: 'inquiry_created', label: 'Inquiry Created', type: 'trigger' },
        { id: 'inquiry_status_updated', label: 'Inquiry Status Updated', type: 'trigger' },
        { id: 'scheduled', label: 'Scheduled', type: 'trigger' },
        { id: 'manual', label: 'Manual Trigger', type: 'trigger' },
        { id: 'webhook_received', label: 'Incoming Webhook', type: 'trigger' },
        { id: 'stripe_payment_received', label: 'Stripe Payment Received', type: 'trigger' },
        { id: 'stripe_subscription_created', label: 'Stripe Subscription Created', type: 'trigger' },
        { id: 'stripe_subscription_cancelled', label: 'Stripe Subscription Cancelled', type: 'trigger' },
        { id: 'stripe_invoice_paid', label: 'Stripe Invoice Paid', type: 'trigger' },
        { id: 'whatsapp_message_received', label: 'WhatsApp Message Received', type: 'trigger' }
    ],
    actions: [
        { id: 'send_email', label: 'Send Email', type: 'action', actionType: 'send_email' },
        { id: 'update_lead', label: 'Update Lead', type: 'action', actionType: 'update_lead' },
        { id: 'update_client', label: 'Update Client', type: 'action', actionType: 'update_client' },
        { id: 'create_task', label: 'Create Task', type: 'action', actionType: 'create_task' },
        { id: 'assign_user', label: 'Assign User', type: 'action', actionType: 'assign_user' },
        { id: 'add_note', label: 'Add Note', type: 'action', actionType: 'add_note' },
        { id: 'update_inquiry', label: 'Update Inquiry', type: 'action', actionType: 'update_inquiry' },
        { id: 'assign_inquiry', label: 'Assign Inquiry', type: 'action', actionType: 'assign_inquiry' },
        { id: 'send_notification', label: 'Send Notification', type: 'action', actionType: 'send_notification' },
        { id: 'webhook', label: 'Webhook', type: 'action', actionType: 'webhook' },
        { id: 'http_request', label: 'HTTP Request', type: 'action', actionType: 'http_request' },
        { id: 'loop_items', label: 'Loop Over Items', type: 'action', actionType: 'loop_items' },
        { id: 'ai_assistant', label: 'AI Assistant', type: 'action', actionType: 'ai_assistant' },
        { id: 'ai_agent', label: 'AI Agent (with tools)', type: 'action', actionType: 'ai_agent' }
    ],
    aiBlog: [
        { id: 'keyword_research', label: 'Keyword Research (Google)', type: 'action', actionType: 'keyword_research' },
        { id: 'gsc_opportunities', label: 'Search Console Opportunities', type: 'action', actionType: 'gsc_opportunities' },
        { id: 'ai_pick_topic', label: 'AI Pick Topic', type: 'action', actionType: 'ai_pick_topic' },
        { id: 'ai_write_blog', label: 'AI Write Blog', type: 'action', actionType: 'ai_write_blog' },
        { id: 'ai_fetch_image', label: 'Fetch Image (Unsplash)', type: 'action', actionType: 'ai_fetch_image' },
        { id: 'ai_post_blog', label: 'Post Blog', type: 'action', actionType: 'ai_post_blog' },
        { id: 'index_url', label: 'Google Search URL Index', type: 'action', actionType: 'index_url' }
    ],
    whatsapp: [
        { id: 'send_whatsapp', label: 'Send WhatsApp', type: 'whatsapp', actionType: 'send_whatsapp' },
        { id: 'send_whatsapp_reply', label: 'Reply on WhatsApp', type: 'whatsapp', actionType: 'send_whatsapp_reply' }
    ],
    conditions: [
        { id: 'condition', label: 'If/Else Condition', type: 'condition' }
    ],
    delays: [
        { id: 'delay', label: 'Wait/Delay', type: 'delay' }
    ]
};

const ALL = Object.values(NODE_PALETTE).flat();
/** Human label for a node's trigger/action id ("send_email" -> "Send Email"). */
export const nodeKindLabel = id => ALL.find(i => i.id === id)?.label || String(id || '').replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
