
<xsl:variable name="nLastPageNr" select="rdXslExtension:GetTokenValue('@Session.rdElementID-LastPageNr~')" />
<xsl:variable name="nPageRowCnt" select="rdXslExtension:GetTokenValue('@Session.rdElementID-PageRowCnt~')" />
<xsl:variable name="nPageNr" select="rdXslExtension:GetTokenValue('@Session.rdElementID-PageNr~')" />

<xsl:variable name="dataRows" select="/*/rdDataID" />
<TableRows1>
	<xsl:choose>
		<xsl:when test="count($dataRows) &gt; 0">
            <TableRows2>
				<xsl:for-each select="$dataRows" >
				<xsl:variable name="rdDataTableID-Position" select="position() + $nPageRowCnt * ($nPageNr - 1)"/>
					<rdTableRows />
					<rdRowEnd />
				</xsl:for-each>
            </TableRows2>
		</xsl:when>
		<xsl:otherwise>
            <TableRows3 />
			<rdTableNoData />
		</xsl:otherwise>
	</xsl:choose>
</TableRows1>