-- =====================================================
-- Helper Functions for MilkBook Backend
-- =====================================================

-- Function to update farmer balance when milk entry is created/updated
CREATE OR REPLACE FUNCTION update_farmer_balance(
    p_farmer_id UUID,
    p_amount DECIMAL(12, 2)
)
RETURNS VOID AS $$
BEGIN
    UPDATE farmers
    SET balance = balance + p_amount,
        updated_at = TIMEZONE('utc', NOW())
    WHERE id = p_farmer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get daily summary for a shop
CREATE OR REPLACE FUNCTION get_daily_summary(
    p_shop_id UUID,
    p_date DATE
)
RETURNS TABLE (
    total_entries BIGINT,
    total_milk DECIMAL(10, 2),
    total_amount DECIMAL(12, 2),
    avg_fat DECIMAL(5, 2),
    avg_snf DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COALESCE(SUM(quantity), 0)::DECIMAL(10, 2),
        COALESCE(SUM(amount), 0)::DECIMAL(12, 2),
        COALESCE(AVG(fat), 0)::DECIMAL(5, 2),
        COALESCE(AVG(snf), 0)::DECIMAL(5, 2)
    FROM milk_intake_entries
    WHERE shop_id = p_shop_id
    AND date = p_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get farmer's monthly summary
CREATE OR REPLACE FUNCTION get_farmer_monthly_summary(
    p_farmer_id UUID,
    p_month_start DATE
)
RETURNS TABLE (
    total_entries BIGINT,
    total_milk DECIMAL(10, 2),
    total_amount DECIMAL(12, 2),
    current_balance DECIMAL(12, 2)
) AS $$
DECLARE
    v_month_end DATE;
BEGIN
    v_month_end := p_month_start + INTERVAL '1 month' - INTERVAL '1 day';
    
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT,
        COALESCE(SUM(quantity), 0)::DECIMAL(10, 2),
        COALESCE(SUM(amount), 0)::DECIMAL(12, 2),
        (SELECT balance FROM farmers WHERE id = p_farmer_id)::DECIMAL(12, 2)
    FROM milk_intake_entries
    WHERE farmer_id = p_farmer_id
    AND date >= p_month_start
    AND date <= v_month_end;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create audit event (already in schema, but here for completeness)
CREATE OR REPLACE FUNCTION create_audit_event(
    p_shop_id UUID,
    p_user_id UUID,
    p_action TEXT,
    p_entity TEXT,
    p_entity_id UUID,
    p_before JSONB,
    p_after JSONB
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO audit_events (
        shop_id,
        user_id,
        action,
        entity,
        entity_id,
        before,
        after
    )
    VALUES (
        p_shop_id,
        p_user_id,
        p_action,
        p_entity,
        p_entity_id,
        p_before,
        p_after
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- END OF HELPER FUNCTIONS
-- =====================================================
