from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from datetime import datetime
import os

class PDFGenerator:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.setup_custom_styles()
    
    def setup_custom_styles(self):
        """Configura estilos customizados para o PDF"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=22,
            spaceAfter=20,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#1976D2')
        ))
        
        self.styles.add(ParagraphStyle(
            name='GreenTitleStyle',
            parent=self.styles['CustomTitle'], # Herda do título principal
            textColor=colors.HexColor('#7CB342') # Muda a cor para verde
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomSubtitle',
            parent=self.styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#424242')
        ))
        
        self.styles.add(ParagraphStyle(
            name='CustomNormal',
            parent=self.styles['Normal'],
            fontSize=11,
            spaceAfter=6,
            leading=14,
            alignment=TA_LEFT
        ))

        self.styles.add(ParagraphStyle(
            name='JustifyNormal',
            parent=self.styles['CustomNormal'],
            alignment=TA_JUSTIFY
        ))

        self.styles.add(ParagraphStyle(
            name='ResultValueStyle',
            parent=self.styles['Normal'],
            fontSize=15,
            fontName='Helvetica-Bold',
            alignment=TA_CENTER,
            textColor=colors.HexColor('#7CB342'),
            leading=16
        ))
        
        self.styles.add(ParagraphStyle(
            name='ResultLabelStyle',
            parent=self.styles['Normal'],
            fontSize=8,
            alignment=TA_CENTER,
            textColor=colors.HexColor('#424242'),
            leading=9
        ))
        
        self.styles.add(ParagraphStyle(
            name='FooterStyle',
            parent=self.styles['Normal'],
            fontSize=8,
            alignment=TA_RIGHT,
            textColor=colors.black
        ))

        # NOVO ESTILO - Valor do resultado em azul
        self.styles.add(ParagraphStyle(
            name='ResultValueStyleBlue',
            parent=self.styles['ResultValueStyle'], # Herda as propriedades do estilo verde
            textColor=colors.HexColor('#1976D2')  # Mas troca a cor para o azul do título
        ))

    def add_background_image(self, canvas, doc, report_type='thermal'):
        """Adiciona a imagem de fundo ao PDF com base no tipo de relatório"""
        if report_type == 'condensation':
            filename = 'fundo_relatorio_frio.png'
        else:
            filename = 'fundo_relatorio.png'
        
        background_path = os.path.join(os.path.dirname(__file__), '..', 'static', filename)
        if os.path.exists(background_path):
            canvas.drawImage(background_path, 0, 0, width=A4[0], height=A4[1], preserveAspectRatio=False)

    def generate_thermal_report(self, data, output_path):
        """Gera relatório PDF para cálculo térmico com o design final de cards"""
        
        def footer_canvas(canvas, doc):
            canvas.saveState()
            date_str = datetime.now().strftime("%d/%m/%Y às %H:%M")
            p = Paragraph(f"Gerado em: {date_str}", self.styles['FooterStyle'])
            w, h = p.wrap(doc.width, doc.bottomMargin)
            x_position = A4[0] - w - (3 * mm)
            p.drawOn(canvas, x_position, h + 10 * mm)
            canvas.restoreState()

        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            rightMargin=inch,
            leftMargin=inch,
            topMargin=inch,
            bottomMargin=inch
        )
        
        story = []

        story.append(Spacer(1, 15 * mm)) 
        story.append(Paragraph("Isolamento Térmico Quente", self.styles['GreenTitleStyle']))
        story.append(Spacer(1, 4 * mm)) 

        story.append(Paragraph("Parâmetros de Entrada", self.styles['CustomSubtitle']))
        
        input_html = f"""
        <b>Material do Isolante:</b> {data.get('material', 'N/A')}<br/>
        <b>Tipo de Acabamento:</b> {data.get('finish', 'N/A')}<br/>
        <b>Tipo de Superfície:</b> {data.get('geometry', 'N/A')}<br/>
        <b>Temperatura da Face Quente:</b> {data.get('hotTemp', 0)}°C<br/>
        <b>Temperatura Ambiente:</b> {data.get('ambientTemp', 0)}°C<br/>
        """
        if data.get('geometry') == 'Tubulação':
            input_html += f"<b>Diâmetro da Tubulação:</b> {data.get('pipeDiameter', 0)} mm<br/>"
        total_thickness = sum(data.get('layerThicknesses', []))
        input_html += f"<b>Espessura Total do Isolante:</b> {total_thickness} mm<br/>"
        story.append(Paragraph(input_html, self.styles['CustomNormal']))
        
        if data.get('calculateFinancial'):
            story.append(Spacer(1, 4 * mm))
            financial_html = f"""
            <b>Tipo de Combustível:</b> {data.get('financialData', {}).get('fuel', 'N/A')}<br/>
            <b>Área do Projeto:</b> {data.get('financialData', {}).get('area', 0)} m²<br/>
            <b>Horas/Dia:</b> {data.get('financialData', {}).get('hoursPerDay', 0)} | <b>Dias/Semana:</b> {data.get('financialData', {}).get('daysPerWeek', 0)}
            """
            story.append(Paragraph(financial_html, self.styles['CustomNormal']))

        story.append(Spacer(1, 10 * mm))

        story.append(Paragraph("Resultados dos Cálculos", self.styles['CustomSubtitle']))
        results = data.get('results', {})
        
        card_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F9F9F9')), 
            ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('ROUNDEDCORNERS', [8, 8, 8, 8]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ])

        def create_card_content(value, label):
            return [
                Paragraph(value, self.styles['ResultValueStyle']),
                Spacer(1, 1*mm),
                Paragraph(label, self.styles['ResultLabelStyle'])
            ]

        temp_fria_content = create_card_content(f"{results.get('temperatureFaceFria', 0)}°C", "Temperatura Face Fria")
        perda_com_content = create_card_content(f"{results.get('perdaComIsolante', 0)} kW/m²", "Perda com Isolante")
        perda_sem_content = create_card_content(f"{results.get('perdaSemIsolante', 0)} kW/m²", "Perda sem Isolante")
        reducao_content = create_card_content(f"{results.get('reducaoPercentual', 0)}%", "Redução de Perda")
        
        row1_data = [[temp_fria_content, perda_com_content, perda_sem_content, reducao_content]]
        row1_table = Table(row1_data, colWidths=[42*mm, 42*mm, 42*mm, 42*mm], rowHeights=20*mm)
        row1_table.setStyle(card_style)
        story.append(row1_table)
        
        if data.get('calculateFinancial'):
            story.append(Spacer(1, 3 * mm))
            eco_mes_content = create_card_content(f"R$ {results.get('economiaMensal', 0):,.2f}", "Economia Mensal")
            eco_ano_content = create_card_content(f"R$ {results.get('economiaAnual', 0):,.2f}", "Economia Anual")
            co2_content = create_card_content(f"{results.get('co2EvitadoTonAno', 0)} t", "CO2 Evitado/Ano")

            row2_data = [[eco_mes_content, eco_ano_content, co2_content]]
            row2_table = Table(row2_data, colWidths=[56.6*mm, 56.6*mm, 56.6*mm], rowHeights=20*mm)
            row2_table.setStyle(card_style)
            story.append(row2_table)
        
        story.append(Spacer(1, 15 * mm))

        note_text = """
        <b>Nota Técnica:</b> Os cálculos são realizados de acordo com as práticas recomendadas pelas normas ASTM C680 e ISO 12241, 
        em conformidade com os procedimentos da norma brasileira ABNT NBR 16281.
        """
        story.append(Paragraph(note_text, self.styles['JustifyNormal']))
        
        doc.build(story, onFirstPage=lambda c, d: (self.add_background_image(c, d, report_type='thermal'), footer_canvas(c, d)), onLaterPages=lambda c, d: (self.add_background_image(c, d, report_type='thermal'), footer_canvas(c, d)))
        
        return output_path

    def generate_condensation_report(self, data, output_path):
        """Gera relatório PDF para cálculo de condensação com o novo design"""
        
        def footer_canvas(canvas, doc):
            canvas.saveState()
            date_str = datetime.now().strftime("%d/%m/%Y às %H:%M")
            p = Paragraph(f"Gerado em: {date_str}", self.styles['FooterStyle'])
            w, h = p.wrap(doc.width, doc.bottomMargin)
            x_position = A4[0] - w - (3 * mm)
            p.drawOn(canvas, x_position, h + 10 * mm)
            canvas.restoreState()

        doc = SimpleDocTemplate(
            output_path,
            pagesize=A4,
            rightMargin=inch,
            leftMargin=inch,
            topMargin=inch,
            bottomMargin=inch
        )
        
        story = []

        story.append(Spacer(1, 15 * mm)) 
        story.append(Paragraph("Isolamento Térmico Frio", self.styles['CustomTitle']))
        story.append(Spacer(1, 8 * mm))

        story.append(Paragraph("Parâmetros de Entrada", self.styles['CustomSubtitle']))
        
        input_html = f"""
        <b>Material do Isolante:</b> {data.get('material', 'N/A')}<br/>
        <b>Tipo de Superfície:</b> {data.get('geometry', 'N/A')}<br/>
        <b>Temperatura Interna:</b> {data.get('internalTemp', 0)}°C<br/>
        <b>Temperatura Ambiente:</b> {data.get('ambientTemp', 0)}°C<br/>
        <b>Umidade Relativa:</b> {data.get('humidity', 0)}%<br/>
        <b>Velocidade do Vento:</b> {data.get('windSpeed', 0)} m/s<br/>
        """
        if data.get('geometry') == 'Tubulação':
            input_html += f"<b>Diâmetro da Tubulação:</b> {data.get('pipeDiameter', 0)} mm<br/>"
        
        story.append(Paragraph(input_html, self.styles['CustomNormal']))
        story.append(Spacer(1, 12 * mm))

        story.append(Paragraph("Resultados dos Cálculos", self.styles['CustomSubtitle']))
        results = data.get('results', {})

        card_style = TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F9F9F9')),
            ('BOX', (0, 0), (-1, -1), 1, colors.lightgrey),
            ('ROUNDEDCORNERS', [8, 8, 8, 8]),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ])

        def create_card_content(value, label, value_style): # <--- Adicionamos o parâmetro aqui
            return [
                Paragraph(value, value_style), # <--- E usamos ele aqui
                Spacer(1, 1*mm),
                Paragraph(label, self.styles['ResultLabelStyle'])
            ]

        dew_point_content = create_card_content(f"{results.get('temperaturaOrvalho', 0)}°C", "Temperatura de Orvalho", self.styles['ResultValueStyleBlue'])
        min_thickness_content = create_card_content(f"{results.get('espessuraMinima', 0)} mm", "Espessura Mínima Recomendada", self.styles['ResultValueStyleBlue'])

        results_data = [[dew_point_content, min_thickness_content]]
        results_table = Table(results_data, colWidths=[84*mm, 84*mm], rowHeights=25*mm)
        results_table.setStyle(card_style)
        story.append(results_table)
        
        story.append(Spacer(1, 15 * mm))

        note_text = """
        <b>Nota Técnica:</b> O cálculo da espessura mínima é baseado na prevenção de condensação superficial, 
        considerando as condições ambientais especificadas e as propriedades térmicas do material isolante.
        """
        story.append(Paragraph(note_text, self.styles['JustifyNormal']))
        
        on_each_page = lambda c, d: (self.add_background_image(c, d, report_type='condensation'), footer_canvas(c, d))
        doc.build(story, onFirstPage=on_each_page, onLaterPages=on_each_page)
        
        return output_path