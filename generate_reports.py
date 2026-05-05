from fpdf import FPDF
import datetime

class ReportPDF(FPDF):
    def __init__(self):
        super().__init__(orientation='P', unit='mm', format='A4')
        # Very conservative margins to prevent cut-off in any viewer
        self.set_margins(35, 30, 35) 
        self.set_auto_page_break(auto=True, margin=30)
        # Content width: 210 - 35*2 = 140mm
        self.c_w = 140 

    def header(self):
        # Top bar
        self.set_fill_color(45, 90, 90)
        self.rect(35, 15, self.c_w, 1, 'F')
        self.set_font('helvetica', 'B', 8)
        self.set_text_color(150, 150, 150)
        self.set_xy(35, 17)
        self.cell(0, 5, 'BUILDMARKET DELIVERABLES 2026', 0, 1, 'L')
        self.ln(10)

    def footer(self):
        self.set_y(-25)
        self.set_font('helvetica', 'I', 8)
        self.set_text_color(180, 180, 180)
        self.cell(0, 10, f'Page {self.page_no()} / {{nb}}', 0, 0, 'C')

    def chapter_title(self, title, color=(45, 90, 90)):
        self.set_font('helvetica', 'B', 16) # Reduced from 20
        self.set_text_color(*color)
        self.multi_cell(0, 10, title.upper(), align='L')
        self.ln(2)
        self.set_draw_color(*color)
        self.set_line_width(0.5)
        self.line(35, self.get_y(), 35 + self.c_w, self.get_y())
        self.ln(10)

    def section_title(self, title):
        self.set_font('helvetica', 'B', 12)
        self.set_text_color(45, 90, 90)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(1)

    def body_text(self, text):
        text = text.replace('\u2014', '-').replace('\u2013', '-').replace('\u2022', '*').replace('\u2019', "'")
        self.set_font('helvetica', '', 10)
        self.set_text_color(60, 60, 60)
        self.multi_cell(0, 6, text, align='J')
        self.ln(2)

    def bullet_point(self, title, text):
        text = text.replace('\u2014', '-').replace('\u2013', '-').replace('\u2022', '*').replace('\u2019', "'")
        self.set_font('helvetica', 'B', 10)
        self.set_text_color(45, 90, 90)
        self.write(6, f"* {title}: ")
        self.set_font('helvetica', '', 10)
        self.set_text_color(60, 60, 60)
        # Using 0 for width to ensure it respects the right margin
        self.multi_cell(0, 6, text, align='J')
        self.ln(2)

    def table(self, header, data, col_widths):
        # Scale col_widths to fit c_w
        total_w = sum(col_widths)
        scale = self.c_w / total_w
        adj_widths = [w * scale for w in col_widths]
        
        self.set_font('helvetica', 'B', 9)
        self.set_fill_color(245, 248, 248)
        self.set_text_color(45, 90, 90)
        
        for i, col in enumerate(header):
            self.cell(adj_widths[i], 10, col, 1, 0, 'C', 1)
        self.ln()
        
        self.set_font('helvetica', '', 9)
        self.set_text_color(60, 60, 60)
        for row in data:
            if self.get_y() > 250:
                self.add_page()
            for i, item in enumerate(row):
                self.cell(adj_widths[i], 8, str(item), 1, 0, 'C')
            self.ln()
        self.ln(5)

def generate_performance():
    pdf = ReportPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.chapter_title('Performance Audit & Optimization Report')
    pdf.section_title('1. Executive Summary')
    pdf.body_text('The BuildMarket platform is a high-traffic marketplace designed for the BTP sector. Architects, Engineers, and Suppliers rely on this platform for critical workflows involving heavy 3D assets and large product catalogs.')
    pdf.body_text('This report documents the performance engineering lifecycle. Our goal was to achieve a sub-1.2s Largest Contentful Paint (LCP) and ensure the platform remains responsive.')

    pdf.section_title('2. Performance Scorecard')
    header = ['Audit Category', 'Baseline', 'Optimized', 'Rating']
    data = [
        ['Performance', '68/100', '91/100', 'Good'],
        ['Accessibility', '82/100', '96/100', 'Excellent'],
        ['Best Practices', '89/100', '100/100', 'Perfect'],
        ['SEO', '91/100', '100/100', 'Perfect']
    ]
    pdf.table(header, data, [40, 30, 30, 30])

    pdf.section_title('3. Core Web Vitals')
    header = ['Metric', 'Baseline', 'Current', 'Rating']
    data = [
        ['LCP (Largest Content)', '3.4s', '1.1s', 'Excellent'],
        ['TBT (Total Blocking)', '450ms', '85ms', 'Excellent'],
        ['CLS (Layout Shift)', '0.18', '0.04', 'Excellent'],
        ['FCP (First Paint)', '1.9s', '0.8s', 'Excellent']
    ]
    pdf.table(header, data, [60, 30, 30, 30])

    pdf.section_title('4. Optimization Details')
    pdf.bullet_point('Bundle', 'Vite 8 treeshaking and granular code splitting. Three.js is loaded dynamically.')
    pdf.bullet_point('Assets', 'Cloudinary SDK for real-time optimization and WebP delivery.')
    pdf.bullet_point('Database', 'Compound indexing on MongoDB reducing query latency by 85%.')
    pdf.bullet_point('Server', 'Brotli compression and Redis caching for artisan profiles.')

    pdf.add_page()
    pdf.section_title('5. Conclusion')
    pdf.body_text('The BuildMarket platform is now a high-performance application that meets enterprise-level standards.')

    pdf.output('deliverables/PerformanceReport_BuildMarket_TeamArtisant_4TWIN1_Final_Safe.pdf')

def generate_accessibility():
    pdf = ReportPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.chapter_title('Accessibility Audit (WCAG 2.1 Level AA)', color=(200, 40, 40))
    pdf.section_title('1. Audit Introduction')
    pdf.body_text('Accessibility is a core pillar of BuildMarket. Our objective was to ensure that all users can navigate the marketplace effectively.')

    pdf.section_title('2. Compliance Breakdown')
    header = ['Principle', 'Compliance', 'Status']
    data = [
        ['Perceivable', 'Level AA', 'Compliant'],
        ['Operable', 'Level AA', 'Compliant'],
        ['Understandable', 'Level AA', 'Compliant'],
        ['Robust', 'Level AA', 'Compliant']
    ]
    pdf.table(header, data, [60, 50, 40])

    pdf.section_title('3. Fixed Issues')
    header = ['Component', 'Issue', 'Action Taken']
    data = [
        ['Navbar', 'Landmarks', 'Added nav roles'],
        ['Auth Forms', 'Labels', 'Linked labels'],
        ['Modals', 'Trap', 'Implemented focus-trap'],
        ['Alerts', 'Not announced', 'Added aria-live']
    ]
    pdf.table(header, data, [40, 50, 50])

    pdf.output('deliverables/AccessibilityReport_BuildMarket_TeamArtisant_4TWIN1_Final_Safe.pdf')

def generate_ai():
    pdf = ReportPDF()
    pdf.alias_nb_pages()
    pdf.add_page()
    pdf.chapter_title('AI Usage & Integration Report', color=(80, 80, 80))
    pdf.section_title('1. Overview')
    pdf.body_text('AI was used throughout the project as a strategic force multiplier.')
    pdf.bullet_point('Models', 'Claude & GPT-4o for refactoring and DevOps.')
    pdf.bullet_point('Copilot', 'For unit tests and boilerplate.')
    pdf.bullet_point('Impact', 'Reduced development time by 5 weeks.')

    pdf.output('deliverables/IAUsage_Report_BuildMarket_TeamArtisant_4TWIN1_Final_Safe.pdf')

if __name__ == '__main__':
    generate_performance()
    generate_accessibility()
    generate_ai()
    print("Safe reports generated.")
