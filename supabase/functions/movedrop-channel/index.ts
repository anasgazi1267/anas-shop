import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Authenticate via X-API-KEY header
  const apiKey = req.headers.get('x-api-key') || req.headers.get('X-API-KEY')
  const expectedKey = Deno.env.get('MOVEDROP_CHANNEL_API_KEY')

  if (!expectedKey || apiKey !== expectedKey) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const url = new URL(req.url)
  const path = url.pathname.split('/movedrop-channel')[1] || '/'
  const method = req.method

  console.log(`[MoveDrop] ${method} ${path} | Full URL: ${req.url}`)
  console.log(`[MoveDrop] Headers:`, JSON.stringify(Object.fromEntries(req.headers.entries())))

  try {
    // ==================== HEALTH CHECK ====================
    if ((path === '/' || path === '') && method === 'GET') {
      return jsonResponse({
        status: 'ok',
        store: 'anas-shop',
        version: '1.0',
        endpoints: [
          'GET /categories',
          'GET /products',
          'GET /products/:id',
          'GET /orders',
          'POST /orders',
          'GET /orders/:id',
          'PUT /orders/:id',
          'POST /webhooks',
        ]
      })
    }

    // ==================== CATEGORIES ====================
    if (path === '/categories' && method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1')
      const perPage = parseInt(url.searchParams.get('per_page') || '100')
      const offset = (page - 1) * perPage

      const { data, error, count } = await supabase
        .from('categories')
        .select('id, name_en, slug, created_at', { count: 'exact' })
        .order('display_order')
        .range(offset, offset + perPage - 1)

      if (error) throw error

      const categories = (data || []).map(c => ({
        id: c.id,
        name: c.name_en,
        slug: c.slug || c.name_en.toLowerCase().replace(/\s+/g, '-'),
        created_at: c.created_at,
      }))

      // Return flat array for simple clients, paginated for advanced
      if (!url.searchParams.has('page')) {
        return jsonResponse(categories)
      }

      return jsonResponse({
        data: categories,
        meta: {
          current_page: page,
          per_page: perPage,
          total: count || 0,
          last_page: Math.ceil((count || 0) / perPage),
        }
      })
    }

    // ==================== PRODUCTS ====================
    if (path === '/products' && method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1')
      const perPage = parseInt(url.searchParams.get('per_page') || '10')
      const offset = (page - 1) * perPage

      const { data, error, count } = await supabase
        .from('products')
        .select('id, name_en, slug, price, discount_price, stock, images, category_id, description_en, sizes, colors, created_at, updated_at, product_type', { count: 'exact' })
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + perPage - 1)

      if (error) throw error

      return jsonResponse({
        data: (data || []).map(p => ({
          id: p.id,
          name: p.name_en,
          slug: p.slug || p.name_en.toLowerCase().replace(/\s+/g, '-'),
          price: Number(p.price),
          sale_price: p.discount_price ? Number(p.discount_price) : null,
          stock: p.stock || 0,
          images: p.images || [],
          category_id: p.category_id,
          description: p.description_en,
          variants: buildVariants(p.sizes, p.colors),
          product_type: p.product_type || 'own',
          created_at: p.created_at,
          updated_at: p.updated_at,
        })),
        meta: {
          current_page: page,
          per_page: perPage,
          total: count || 0,
          last_page: Math.ceil((count || 0) / perPage),
        }
      })
    }

    // GET single product
    if (path.startsWith('/products/') && method === 'GET') {
      const productId = path.split('/products/')[1]
      
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single()

      if (error || !data) {
        return jsonResponse({ error: 'Product not found' }, 404)
      }

      return jsonResponse({
        data: {
          id: data.id,
          name: data.name_en,
          slug: data.slug,
          price: Number(data.price),
          sale_price: data.discount_price ? Number(data.discount_price) : null,
          stock: data.stock || 0,
          images: data.images || [],
          category_id: data.category_id,
          description: data.description_en,
          variants: buildVariants(data.sizes, data.colors),
          product_type: data.product_type || 'own',
          created_at: data.created_at,
          updated_at: data.updated_at,
        }
      })
    }

    // ==================== ORDERS ====================
    // GET orders
    if (path === '/orders' && method === 'GET') {
      const page = parseInt(url.searchParams.get('page') || '1')
      const perPage = parseInt(url.searchParams.get('per_page') || '10')
      const status = url.searchParams.get('status')
      const offset = (page - 1) * perPage

      let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + perPage - 1)

      if (status) {
        query = query.eq('status', status)
      }

      const { data, error, count } = await query
      if (error) throw error

      return jsonResponse({
        data: (data || []).map(formatOrderForMoveDrop),
        meta: {
          current_page: page,
          per_page: perPage,
          total: count || 0,
          last_page: Math.ceil((count || 0) / perPage),
        }
      })
    }

    // POST create order (MoveDrop creates order on our store)
    if (path === '/orders' && method === 'POST') {
      const body = await req.json()
      
      const trackingResult = await supabase.rpc('generate_tracking_id')
      
      const orderData = {
        tracking_id: trackingResult.data || `MD-${Date.now().toString().slice(-6)}`,
        customer_name: body.customer_name || body.shipping?.name || 'MoveDrop Order',
        customer_phone: body.customer_phone || body.shipping?.phone || '',
        customer_address: body.customer_address || body.shipping?.address || '',
        product_ids: body.product_ids || body.line_items?.map((li: any) => li.product_id) || [],
        total_amount: body.total_amount || body.total || 0,
        delivery_charge: body.delivery_charge || body.shipping_cost || 0,
        payment_method: 'movedrop',
        status: 'pending',
        notes: `MoveDrop Order #${body.movedrop_order_id || body.order_id || 'N/A'}`,
        product_sizes: body.product_sizes || body.line_items?.map((li: any) => ({
          product_id: li.product_id,
          size: li.variant?.size || '',
          color: li.variant?.color || '',
          quantity: li.quantity || 1,
        })) || [],
        product_quantities: body.product_quantities || body.line_items?.map((li: any) => ({
          product_id: li.product_id,
          quantity: li.quantity || 1,
        })) || [],
      }

      const { data, error } = await supabase
        .from('orders')
        .insert([orderData])
        .select()
        .single()

      if (error) throw error

      return jsonResponse({
        data: formatOrderForMoveDrop(data),
        message: 'Order created successfully'
      }, 201)
    }

    // GET single order
    if (path.startsWith('/orders/') && method === 'GET') {
      const orderId = path.split('/orders/')[1]
      
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (error || !data) {
        return jsonResponse({ error: 'Order not found' }, 404)
      }

      return jsonResponse({ data: formatOrderForMoveDrop(data) })
    }

    // PUT update order status
    if (path.startsWith('/orders/') && method === 'PUT') {
      const orderId = path.split('/orders/')[1]
      const body = await req.json()
      
      const updateData: Record<string, any> = {}
      if (body.status) updateData.status = body.status
      if (body.tracking_number) updateData.tracking_id = body.tracking_number
      if (body.notes) updateData.notes = body.notes

      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select()
        .single()

      if (error) throw error

      return jsonResponse({
        data: formatOrderForMoveDrop(data),
        message: 'Order updated successfully'
      })
    }

    // ==================== WEBHOOKS SETUP ====================
    if (path === '/webhooks' && method === 'POST') {
      // MoveDrop may register webhook URLs
      const body = await req.json()
      
      // Store webhook config in settings
      await supabase
        .from('settings')
        .upsert({ key: 'movedrop_webhook_url', value: body.url || body.webhook_url })

      return jsonResponse({ message: 'Webhook registered successfully' })
    }

    return jsonResponse({ error: 'Not Found', available_endpoints: [
      'GET /categories',
      'GET /products',
      'GET /products/:id',
      'GET /orders',
      'POST /orders',
      'GET /orders/:id',
      'PUT /orders/:id',
      'POST /webhooks',
    ]}, 404)

  } catch (error) {
    console.error('MoveDrop Channel Error:', error)
    return jsonResponse(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      500
    )
  }
})

function jsonResponse(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

function buildVariants(sizes: string[] | null, colors: string[] | null) {
  const variants: any[] = []
  const sizeList = sizes || []
  const colorList = colors || []

  if (sizeList.length === 0 && colorList.length === 0) return variants

  if (sizeList.length > 0 && colorList.length > 0) {
    for (const size of sizeList) {
      for (const color of colorList) {
        variants.push({ size, color, sku: `${size}-${color}` })
      }
    }
  } else if (sizeList.length > 0) {
    for (const size of sizeList) {
      variants.push({ size, sku: size })
    }
  } else {
    for (const color of colorList) {
      variants.push({ color, sku: color })
    }
  }
  return variants
}

function formatOrderForMoveDrop(order: any) {
  return {
    id: order.id,
    tracking_id: order.tracking_id,
    status: order.status,
    customer: {
      name: order.customer_name,
      phone: order.customer_phone,
      address: order.customer_address,
    },
    total_amount: Number(order.total_amount),
    delivery_charge: Number(order.delivery_charge || 0),
    payment_method: order.payment_method,
    products: order.product_ids || [],
    product_sizes: order.product_sizes,
    product_quantities: order.product_quantities,
    notes: order.notes,
    created_at: order.created_at,
    updated_at: order.updated_at,
  }
}
