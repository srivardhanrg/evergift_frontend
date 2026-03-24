# Production Issues Analysis & Fixes

## Issue 1: Digital PDF Download - "Taking Longer Than Expected" Error

### Root Cause
**TIMING MISMATCH** between frontend timeout and backend generation time:

**Frontend (`usePdfDownload.ts`):**
- 15-second timeout (line 63-65)
- Retries 3 times with 5-second delays
- Total wait: ~15 seconds
- Shows error: "Download is taking longer than expected" (line 161)

**Backend (`storygift_tasks.py::generate_remaining_pages_and_pdf`):**
- Generates 5 locked AI pages (15,17,19,21,23): **50-75 seconds** (10-15s each via Fal.ai)
- Processes filler pages with text overlays: **10-20 seconds**
- Generates PDF: **5-10 seconds**
- **Total time: 65-105 seconds (1-2 minutes)**

### Flow Breakdown
1. User purchases digital book → Shopify webhook fires
2. Webhook calls `background_tasks.add_task(generate_pdf, ...)` ✅
3. Backend starts generating pages (runs in background)
4. Frontend polls `/api/download/:previewId` every 3 seconds
5. Backend returns `status: "generating"` while working
6. Frontend timeout hits at 15 seconds → shows error ❌
7. Backend finishes after ~90 seconds → PDF ready
8. User sees error but PDF is actually ready if they refresh

### Current Status Detection Logic
**Backend** (`app/api/endpoints/download.py`):
```python
# Returns status based on:
- 'not_purchased': payment_status != 'paid'
- 'generating': generation_phase in ('generating_full', 'generating_locked', 'pages_complete')
- 'pdf_missing': pdf_url exists in DB but file doesn't exist in R2
- 'ready': pdf_url exists and file exists in R2
```

### The Fix Strategy

**Option 1: Increase Frontend Timeout (SIMPLE FIX)**
- Change timeout from 15s to 180s (3 minutes)
- Change retry count from 3 to 10
- Change retry delay from 5s to 10s
- Total wait: 100 seconds

**Option 2: Better Progress Feedback (RECOMMENDED)**
- Keep polling but show progress percentage from `generation_progress` field
- Show current phase: "Generating pages 15-25..." (from `generation_phase`)
- Show estimated time: "Usually takes 2-3 minutes"
- Remove timeout, keep polling until complete

**Option 3: Email Notification (SUPPLEMENTARY)**
- Backend sends email when PDF is ready ✅ (already implemented at line 1261-1272)
- User can come back and download anytime
- Issue: Email delivery might be slow or go to spam

### Files to Fix

1. **`Magictales/hooks/usePdfDownload.ts`**
   - Line 63-65: Increase timeout to 180000ms (3 minutes)
   - Line 74: Increase maxRetries to 10
   - Line 75: Increase retryDelayMs to 10000ms (10 seconds)
   - Line 137: Update message to match new timing

2. **`Magictales/pages/PreviewStoryV2.tsx`** (if showing download UI)
   - Add progress indicator showing `generationProgress` from preview status
   - Show current phase message


---

## Issue 2: Physical Book Flow - Status Check

### Flow Overview
**Physical Order Path:**
1. User selects physical book (softcover/hardcover) → adds to cart
2. User purchases → Shopify webhook fires
3. Webhook detects `order_type: "physical"` by variant ID
4. Backend calls `generate_remaining_pages_and_pdf(order_type="physical")`
5. Generates all 26 pages (~90 seconds)
6. Generates PDF with blank back page for print
7. Submits to Lulu API with shipping address
8. Lulu accepts job → returns print job ID
9. Backend stores print job ID in `print_orders` table
10. User receives tracking via email (from Lulu)

### Critical Code Points

**Variant Detection** (`shopify.py` lines 88-105):
```python
softcover_variant_id = str(settings.shopify_softcover_variant_id or "")
hardcover_variant_id = str(settings.shopify_hardcover_variant_id or "")

for item in line_items:
    variant_id = str(item.get("variant_id", ""))

    if softcover_variant_id and variant_id == softcover_variant_id:
        order_type = "physical"
        cover_type = "softcover"
    elif hardcover_variant_id and variant_id == hardcover_variant_id:
        order_type = "physical"
        cover_type = "hardcover"
```

**Lulu Submission** (`storygift_tasks.py` lines 1217-1259):
```python
if order_type == "physical":
    from app.background.lulu_tasks import submit_lulu_print_job

    for attempt in range(3):
        try:
            await submit_lulu_print_job(
                order_id=order_id,
                preview_id=preview_id
            )
            lulu_submitted = True
            break
        except Exception as e:
            logger.warning(f"Lulu submission attempt {attempt + 1} failed", error=str(e))
            if attempt < 2:
                await asyncio.sleep(2 ** attempt)  # Exponential backoff
```

### Potential Issues

1. **Environment Variables Missing?**
   - Check if `SHOPIFY_SOFTCOVER_VARIANT_ID` and `SHOPIFY_HARDCOVER_VARIANT_ID` are set in production
   - Check if Lulu credentials are set: `LULU_CLIENT_KEY`, `LULU_CLIENT_SECRET`, `LULU_API_BASE`

2. **Lulu API Failures**
   - Lulu submission retries 3 times with exponential backoff
   - If all retries fail, order completes but print job not submitted
   - Error logged but user not notified

3. **Shipping Address Issues**
   - Lulu requires phone number (line 224)
   - If Shopify shipping address missing phone, Lulu will reject

4. **PDF Format Issues**
   - Lulu requires specific PDF format (8.5" x 8.5", 300 DPI, CMYK color)
   - Check if `storygift_pdf_generator_v2.py` outputs correct format

### How to Verify Physical Flow

**Check Environment Variables:**
```bash
# In production backend (Render)
echo $SHOPIFY_SOFTCOVER_VARIANT_ID
echo $SHOPIFY_HARDCOVER_VARIANT_ID
echo $LULU_CLIENT_KEY
echo $LULU_API_BASE
```

**Check Database:**
```sql
-- Check if orders are being created with physical type
SELECT order_id, order_type, cover_type, status, error_message
FROM orders
WHERE order_type = 'physical'
ORDER BY created_at DESC
LIMIT 10;

-- Check if print jobs are being submitted
SELECT po.*, o.order_number
FROM print_orders po
JOIN orders o ON po.order_id = o.order_id
ORDER BY po.created_at DESC
LIMIT 10;
```

**Check Logs:**
```bash
# Search for Lulu submission logs
grep "Lulu submission" logs/app.log | tail -20
grep "Physical order" logs/app.log | tail -20
```

### Physical Book Checklist

- [ ] Variant IDs configured in Shopify Admin
- [ ] Variant IDs set in backend env vars
- [ ] Lulu credentials configured and valid
- [ ] Lulu API base URL correct (sandbox vs production)
- [ ] Shipping addresses include phone numbers
- [ ] PDF generator outputs Lulu-compatible format
- [ ] Email notifications working for physical orders
- [ ] Test order placed and tracked in Lulu dashboard


---

## Immediate Action Items

### For Digital PDF Issue:
1. ✅ Update frontend timeout to 3 minutes
2. ✅ Add progress indicator to download UI
3. ✅ Update error messages to set correct expectations
4. ✅ Verify email notifications are working

### For Physical Book Flow:
1. ❌ Verify environment variables in production
2. ❌ Test full physical order flow end-to-end
3. ❌ Check Lulu API credentials and endpoint
4. ❌ Review recent physical orders in database
5. ❌ Check error logs for Lulu submission failures

### Testing Plan:
1. **Digital Flow Test:**
   - Create preview
   - Purchase digital book
   - Wait 3 minutes
   - Verify PDF downloads
   - Check email received

2. **Physical Flow Test:**
   - Create preview
   - Purchase physical book (hardcover)
   - Wait 3 minutes
   - Check `orders` table: `order_type='physical'`, `cover_type='hardcover'`
   - Check `print_orders` table: has `lulu_print_job_id`
   - Check Lulu dashboard: job submitted
   - Verify confirmation email sent


---

## Summary

**Digital PDF Issue:** ✅ Identified - Frontend timeout too short
**Physical Book Flow:** ⚠️ Needs verification - Environment variables and Lulu integration

**Recommended First Fix:** Increase frontend timeout and add progress feedback for digital downloads.
