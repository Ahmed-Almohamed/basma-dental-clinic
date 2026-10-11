# User guide

## First sign-in

Use the privately supplied initial credentials. The account screen requires a new password of at least 12 characters before opening records. The username is editable there too. Later, open **الإعدادات → الحساب → تغيير بيانات الدخول**.

## Book a visit

1. Choose **حجز موعد** or **مريض جديد**.
2. Type a name or phone number. Select an existing patient suggestion, or enter a new patient's name and optional phone.
3. Add allergies and other patient details if needed.
4. Select treatments from the existing plan, or choose **إضافة علاج وسعره** for each new treatment. Enter its full agreed price and select a tooth or general treatment.
5. If you are booking without a treatment plan, choose the session type and tooth, or **جلسة عامة**.
6. Pick a day and an available time, then save. The patient and appointment are saved together.

Similar names must be resolved explicitly. Reserved and overlapping times cannot be booked. A new appointment is 30 minutes; pre-existing longer appointments retain their duration.

## During the day

Move waiting patients with the drag handle or arrow buttons. Reordering changes entry order, not the appointment time. Edit or reschedule from the card. Cancelled and completed visits are retained in history.

Choose **تمت الجلسة** after the visit. Enter an optional received payment and choose a follow-up or completion. Follow-up booking carries the patient, session type and tooth forward; review and change these where needed.

## Patient record

The patient profile contains medical details, an FDI chart and treatment plan, visit history, receipts and attachments. Use **إضافة علاجات** to add several treatments together; existing treatment prices can be edited individually. New bookings can add treatments directly. To add a new treatment to an already saved booking, add it to the patient plan first, then select it when editing the appointment. Payment totals compare receipts against the non-cancelled treatment plan; they are not an insurance claim or general accounting ledger.

## Export

Patient CSV follows the current name/phone search. Settings provides a JSON export of structured clinic records. Attachment files are downloaded separately. Exported files may contain patient information; keep them within the clinic's approved storage.


## Treatment costs and payments

- The account summary stays visible in the patient profile. It includes all non-cancelled planned, active and completed treatments with known prices.
- Leave an unknown price blank. It is flagged and excluded from totals until a price is entered. Enter zero only for a free treatment. Existing prices are preserved during migration.
- At session completion, select the treatments actually performed and enter an optional payment. The remaining balance preview updates before saving. Payments reduce the overall patient balance, rather than being allocated to individual teeth.
- Follow-up keeps selected treatments active and carries them into the next booking. Finishing marks only selected treatments complete. Other treatments are unchanged. Neither action adds another charge.
- Cancelling an appointment does not cancel its treatment plan. Cancelling a treatment removes its price from the total but preserves receipts; an overpayment appears as patient credit. No automatic refund is issued.
- Prices can be revised, which changes the current total; there is no historical price-revision audit trail.
