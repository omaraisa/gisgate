import re
import csv

# Read the SQL file
with open(r'd:\sandbox\gisgate\courses investigation data\gisgate_mini.sql', 'r', encoding='utf-8') as f:
    sql_content = f.read()

# Find all INSERT INTO wp_posts VALUES statements
insert_pattern = r"INSERT INTO `wp_posts` \([^)]+\) VALUES\s*\((.*?)\);"
matches = re.findall(insert_pattern, sql_content, re.DOTALL)

enrollments = []

for match in matches:
    # Split by '),(' to get individual rows
    rows = re.split(r'\),\s*\(', match)
    for row in rows:
        # Clean up
        row = row.strip()
        if not row:
            continue
        # Parse the values
        # Format: (ID, post_author, post_date, post_date_gmt, post_content, post_title, post_excerpt, post_status, comment_status, ping_status, post_password, post_name, to_ping, pinged, post_modified, post_modified_gmt, post_content_filtered, post_parent, guid, menu_order, post_type, post_mime_type, comment_count)
        values = row.split(',')
        if len(values) >= 21:
            post_type = values[20].strip().strip("'")
            if post_type == 'tutor_enrolled':
                try:
                    post_id = int(values[0].strip())
                    user_id = int(values[1].strip())
                    enrolled_at = values[2].strip().strip("'")
                    course_id = int(values[17].strip())
                    status = values[7].strip().strip("'")
                    enrollments.append({
                        'post_id': post_id,
                        'user_id': user_id,
                        'course_id': course_id,
                        'enrolled_at': enrolled_at,
                        'status': status
                    })
                except ValueError:
                    continue

# Write to CSV
with open(r'd:\sandbox\gisgate\courses investigation data\wp_enrollments.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=['post_id', 'user_id', 'course_id', 'enrolled_at', 'status'])
    writer.writeheader()
    writer.writerows(enrollments)

print(f"Extracted {len(enrollments)} enrollments")