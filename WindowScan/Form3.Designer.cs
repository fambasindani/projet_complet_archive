namespace WindowScan
{
    partial class Form3
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.buttonCreatePdf = new System.Windows.Forms.Button();
            this.SuspendLayout();
            // 
            // buttonCreatePdf
            // 
            this.buttonCreatePdf.Location = new System.Drawing.Point(309, 168);
            this.buttonCreatePdf.Name = "buttonCreatePdf";
            this.buttonCreatePdf.Size = new System.Drawing.Size(223, 66);
            this.buttonCreatePdf.TabIndex = 0;
            this.buttonCreatePdf.Text = "buttonCreateP";
            this.buttonCreatePdf.UseVisualStyleBackColor = true;
            this.buttonCreatePdf.Click += new System.EventHandler(this.buttonCreatePdf_Click_1);
            // 
            // Form3
            // 
            this.AutoScaleDimensions = new System.Drawing.SizeF(8F, 16F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            this.ClientSize = new System.Drawing.Size(800, 450);
            this.Controls.Add(this.buttonCreatePdf);
            this.Name = "Form3";
            this.Text = "Form3";
            this.Load += new System.EventHandler(this.Form3_Load);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.Button buttonCreatePdf;
    }
}