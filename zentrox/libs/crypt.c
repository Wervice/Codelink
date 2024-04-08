#include <unistd.h>
#include <stdio.h>

int main()
{
	char *password;
	password = crypt("def", "$6$SameSalt$");
	printf("%s", password);
}
